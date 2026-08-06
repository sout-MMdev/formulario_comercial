// ================================================================
// BUSCA EM FOLHA (mobile)
//
// Substitui o autocomplete suspenso do desktop. No celular uma
// lista que abre abaixo do campo fica escondida atrás do teclado
// virtual — então aqui a busca ocupa a TELA INTEIRA: campo no topo,
// resultados preenchendo o resto, teclado embaixo. É o padrão que
// aplicativos de mapa e de banco usam.
//
// É genérica: não sabe se busca cidade, rua ou agência.
// ================================================================

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icone, type NomeIcone } from "./Icone";
import "./BuscaEmFolha.css";

export interface Sugestao {
  chave: string;
  rotulo: string;
  detalhe?: string;
}

interface PropsBuscaEmFolha {
  id?: string;
  /** Valor final que fica no formulário. */
  valor: string;
  /** Texto do campo fechado quando está vazio. */
  placeholder: string;
  titulo: string;
  icone: NomeIcone;
  invalido?: boolean;

  /** Texto digitado dentro da busca (controlado pelo pai). */
  termo: string;
  aoDigitar: (termo: string) => void;
  sugestoes: Sugestao[];
  carregando?: boolean;
  dica?: string;
  /** Aviso quando há termo mas nenhum resultado. */
  vazio?: string;

  aoEscolher: (sugestao: Sugestao) => void;
  /** Fecha a folha logo após escolher uma sugestão (seleção final). */
  fecharAoEscolher?: boolean;
  /** Aceita o texto digitado como valor livre. */
  aoAceitarLivre: (texto: string) => void;
  /** Chamado ao abrir, para o pai preparar o termo inicial. */
  aoAbrir?: () => void;
}

export function BuscaEmFolha({
  id,
  valor,
  placeholder,
  titulo,
  icone,
  invalido = false,
  termo,
  aoDigitar,
  sugestoes,
  carregando = false,
  dica,
  vazio,
  aoEscolher,
  fecharAoEscolher = false,
  aoAceitarLivre,
  aoAbrir,
}: PropsBuscaEmFolha) {
  const [aberta, setAberta] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  // Foca o campo ao abrir — o teclado sobe junto e o usuário já
  // digita, sem um toque a mais.
  useEffect(() => {
    if (!aberta) return;
    document.body.classList.add("com-folha-aberta");
    const foco = setTimeout(() => entrada.current?.focus(), 120);
    return () => {
      document.body.classList.remove("com-folha-aberta");
      clearTimeout(foco);
    };
  }, [aberta]);

  function abrir() {
    aoAbrir?.();
    setAberta(true);
  }

  function fecharAceitando() {
    if (termo.trim()) aoAceitarLivre(termo.trim());
    setAberta(false);
  }

  return (
    <>
      <button
        id={id}
        type="button"
        className={[
          "busca-gatilho",
          valor ? "busca-gatilho--preenchido" : "",
          invalido ? "busca-gatilho--invalido" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={abrir}
      >
        <Icone nome={icone} tamanho={20} className="busca-gatilho__icone" />
        <span className="busca-gatilho__texto">{valor || placeholder}</span>
      </button>

      {aberta &&
        createPortal(
          <div className="busca-tela">
            {/* Barra de busca fixa no topo, dentro da safe area */}
            <header className="busca-topo">
              <button
                type="button"
                className="busca-topo__voltar"
                onClick={fecharAceitando}
                aria-label="Concluir busca"
              >
                <Icone nome="seta_esquerda" tamanho={22} />
              </button>

              <div className="busca-topo__campo">
                <input
                  ref={entrada}
                  type="text"
                  className="busca-topo__entrada"
                  placeholder={titulo}
                  value={termo}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  enterKeyHint="search"
                  onChange={(evento) => aoDigitar(evento.target.value)}
                  onKeyDown={(evento) => {
                    if (evento.key === "Enter") {
                      evento.preventDefault();
                      fecharAceitando();
                    }
                  }}
                />

                {termo && (
                  <button
                    type="button"
                    className="busca-topo__limpar"
                    onClick={() => {
                      aoDigitar("");
                      entrada.current?.focus();
                    }}
                    aria-label="Limpar"
                  >
                    <Icone nome="fechar" tamanho={18} />
                  </button>
                )}
              </div>
            </header>

            <div className="busca-corpo rolagem-suave">
              {carregando && (
                <p className="busca-aviso">
                  <span className="busca-girando">
                    <Icone nome="alvo" tamanho={16} />
                  </span>
                  Buscando...
                </p>
              )}

              {!carregando && sugestoes.length === 0 && termo.trim() && vazio && (
                <p className="busca-aviso">{vazio}</p>
              )}

              {!carregando && !termo.trim() && dica && (
                <p className="busca-aviso">{dica}</p>
              )}

              <ul className="busca-lista">
                {sugestoes.map((sugestao) => (
                  <li key={sugestao.chave}>
                    <button
                      type="button"
                      className="busca-item"
                      onClick={() => {
                        aoEscolher(sugestao);
                        if (fecharAoEscolher) setAberta(false);
                      }}
                    >
                      <Icone
                        nome={icone}
                        tamanho={18}
                        className="busca-item__icone"
                      />

                      <span className="busca-item__texto">
                        <span className="busca-item__rotulo">
                          {sugestao.rotulo}
                        </span>
                        {sugestao.detalhe && (
                          <span className="busca-item__detalhe">
                            {sugestao.detalhe}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Aceitar o que foi digitado, mesmo fora da lista —
                  agência nova ou cidade que a API não trouxe */}
              {termo.trim().length >= 2 && (
                <button
                  type="button"
                  className="busca-livre"
                  onClick={fecharAceitando}
                >
                  <Icone nome="checar" tamanho={18} />
                  Usar “{termo.trim()}”
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
