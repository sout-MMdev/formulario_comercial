// ================================================================
// AUTOCOMPLETE
// Campo de texto com lista de sugestões. É genérico: não sabe se
// está sugerindo cidade, rua ou agência — quem usa passa a lista.
//
// Aceita valor livre: se o usuário digitar algo que não está na
// lista, o texto vale. As sugestões são um atalho, não uma trava.
//
// Teclado: ↑ ↓ navegam, Enter escolhe, Esc fecha.
// ================================================================

import { useEffect, useRef, useState } from "react";
import { Icone, type NomeIcone } from "@/componentes/ui/Icone";
import { useCliqueFora } from "@/hooks/useCliqueFora";
import "./Autocomplete.css";

export interface SugestaoAutocomplete {
  chave: string;
  rotulo: string;
  /** Linha secundária, menor e mais clara. */
  detalhe?: string;
}

interface PropsAutocomplete {
  id?: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  /** Chamado quando uma sugestão da lista é escolhida. */
  aoSelecionar: (sugestao: SugestaoAutocomplete) => void;
  sugestoes: SugestaoAutocomplete[];
  placeholder?: string;
  icone?: NomeIcone;
  carregando?: boolean;
  /** Mensagem quando há busca mas nenhum resultado. */
  textoVazio?: string;
  invalido?: boolean;
  className?: string;
}

export function Autocomplete({
  id,
  valor,
  aoAlterar,
  aoSelecionar,
  sugestoes,
  placeholder,
  icone,
  carregando = false,
  textoVazio,
  invalido = false,
  className = "",
}: PropsAutocomplete) {
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(-1);
  const raiz = useRef<HTMLDivElement>(null);

  useCliqueFora(raiz, () => setAberto(false), aberto);

  // Nova lista de sugestões → volta o destaque para o começo
  useEffect(() => {
    setDestacado(-1);
  }, [sugestoes]);

  const mostraLista = aberto && (sugestoes.length > 0 || carregando || Boolean(textoVazio));

  function escolher(sugestao: SugestaoAutocomplete) {
    aoSelecionar(sugestao);
    setAberto(false);
    setDestacado(-1);
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Escape") {
      setAberto(false);
      return;
    }

    if (!mostraLista || sugestoes.length === 0) return;

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setDestacado((atual) => (atual + 1) % sugestoes.length);
      return;
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setDestacado((atual) =>
        atual <= 0 ? sugestoes.length - 1 : atual - 1,
      );
      return;
    }

    if (evento.key === "Enter" && destacado >= 0) {
      evento.preventDefault();
      escolher(sugestoes[destacado]);
    }
  }

  return (
    <div className={`autocomplete ${className}`.trim()} ref={raiz}>
      <div className="autocomplete__campo">
        {icone && (
          <span className="autocomplete__icone">
            <Icone nome={icone} tamanho={16} />
          </span>
        )}

        <input
          id={id}
          type="text"
          className={[
            "controle",
            icone ? "autocomplete__entrada--com-icone" : "",
            invalido ? "controle--invalido" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          value={valor}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={mostraLista}
          aria-autocomplete="list"
          onChange={(evento) => {
            aoAlterar(evento.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={aoTeclar}
        />
      </div>

      {mostraLista && (
        <ul className="autocomplete__lista rolagem-fina" role="listbox">
          {carregando && (
            <li className="autocomplete__aviso">
              <span className="autocomplete__girando">
                <Icone nome="alvo" tamanho={14} />
              </span>
              Buscando...
            </li>
          )}

          {!carregando && sugestoes.length === 0 && textoVazio && (
            <li className="autocomplete__aviso">{textoVazio}</li>
          )}

          {!carregando &&
            sugestoes.map((sugestao, indice) => (
              <li key={sugestao.chave} role="option" aria-selected={indice === destacado}>
                <button
                  type="button"
                  className={[
                    "autocomplete__item",
                    indice === destacado ? "autocomplete__item--destacado" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  // mousedown roda antes do blur do input
                  onMouseDown={(evento) => {
                    evento.preventDefault();
                    escolher(sugestao);
                  }}
                  onMouseEnter={() => setDestacado(indice)}
                >
                  <span className="autocomplete__item-rotulo">
                    {sugestao.rotulo}
                  </span>
                  {sugestao.detalhe && (
                    <span className="autocomplete__item-detalhe">
                      {sugestao.detalhe}
                    </span>
                  )}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
