// ================================================================
// MULTISSELEÇÃO
// Botão que abre uma lista de caixas de seleção. O botão mostra o
// que já foi escolhido; a lista tem busca quando é longa.
// Usado em "Produtos" e "Atendente de preferência".
// ================================================================

import { useMemo, useRef, useState } from "react";
import { Icone } from "@/componentes/ui/Icone";
import { useCliqueFora } from "@/hooks/useCliqueFora";
import { removerAcentos } from "@cativa/nucleo/utils";
import "./MultiSelecao.css";

interface PropsMultiSelecao {
  id?: string;
  opcoes: string[];
  selecionados: string[];
  aoAlterar: (selecionados: string[]) => void;
  placeholder?: string;
  /** A partir de quantas opções mostrar o campo de busca. */
  limiteParaBusca?: number;
}

export function MultiSelecao({
  id,
  opcoes,
  selecionados,
  aoAlterar,
  placeholder = "Selecione...",
  limiteParaBusca = 10,
}: PropsMultiSelecao) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const raiz = useRef<HTMLDivElement>(null);

  useCliqueFora(raiz, () => setAberto(false), aberto);

  const mostraBusca = opcoes.length >= limiteParaBusca;

  const filtradas = useMemo(() => {
    if (!busca.trim()) return opcoes;
    const termo = removerAcentos(busca);
    return opcoes.filter((opcao) => removerAcentos(opcao).includes(termo));
  }, [opcoes, busca]);

  function alternar(opcao: string) {
    const jaTem = selecionados.includes(opcao);
    aoAlterar(
      jaTem
        ? selecionados.filter((item) => item !== opcao)
        : [...selecionados, opcao],
    );
  }

  return (
    <div className="multi" ref={raiz}>
      <button
        id={id}
        type="button"
        className={`multi__botao ${aberto ? "multi__botao--aberto" : ""}`.trim()}
        aria-expanded={aberto}
        onClick={() => {
          setAberto((estava) => !estava);
          setBusca("");
        }}
      >
        <span
          className={
            selecionados.length > 0 ? "multi__resumo" : "multi__placeholder"
          }
        >
          {selecionados.length > 0
            ? `${selecionados.length} selecionado${selecionados.length > 1 ? "s" : ""}`
            : placeholder}
        </span>

        <Icone nome="seta_baixo" tamanho={16} className="multi__seta" />
      </button>

      {/* Etiquetas do que já foi escolhido, removíveis no clique */}
      {selecionados.length > 0 && (
        <div className="etiquetas multi__escolhidos">
          {selecionados.map((item) => (
            <button
              key={item}
              type="button"
              className="etiqueta etiqueta--marca multi__escolhido"
              onClick={() => alternar(item)}
              title={`Remover ${item}`}
            >
              {item}
              <Icone nome="fechar" tamanho={11} />
            </button>
          ))}
        </div>
      )}

      {aberto && (
        <div className="multi__painel">
          {mostraBusca && (
            <div className="multi__busca">
              <Icone nome="alvo" tamanho={14} />
              <input
                type="text"
                className="multi__busca-entrada"
                placeholder="Filtrar..."
                value={busca}
                autoFocus
                onChange={(evento) => setBusca(evento.target.value)}
              />
            </div>
          )}

          <div className="multi__lista rolagem-fina">
            {filtradas.length === 0 && (
              <p className="multi__vazio">Nenhuma opção encontrada.</p>
            )}

            {filtradas.map((opcao) => {
              const marcada = selecionados.includes(opcao);

              return (
                <label
                  key={opcao}
                  className={`opcao ${marcada ? "opcao--marcada" : ""}`.trim()}
                >
                  <input
                    type="checkbox"
                    className="opcao__entrada"
                    checked={marcada}
                    onChange={() => alternar(opcao)}
                  />
                  <span>{opcao}</span>
                </label>
              );
            })}
          </div>

          <div className="multi__rodape">
            <button
              type="button"
              className="multi__acao"
              onClick={() => aoAlterar([])}
              disabled={selecionados.length === 0}
            >
              Limpar
            </button>
            <button
              type="button"
              className="multi__acao multi__acao--forte"
              onClick={() => setAberto(false)}
            >
              Pronto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
