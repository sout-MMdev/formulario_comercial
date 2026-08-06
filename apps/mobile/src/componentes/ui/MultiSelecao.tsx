// ================================================================
// MULTISSELEÇÃO (mobile)
// No desktop é uma lista suspensa. No celular vira uma folha em
// tela quase cheia: lista longa (22 atendentes) precisa de espaço
// e de busca, não de um dropdown de 240px.
// ================================================================

import { useMemo, useState } from "react";
import { Botao } from "./Botao";
import { Icone } from "./Icone";
import { Folha } from "./Folha";
import { removerAcentos } from "@cativa/nucleo/utils";
import "./MultiSelecao.css";

interface PropsMultiSelecao {
  id?: string;
  titulo: string;
  opcoes: string[];
  selecionados: string[];
  aoAlterar: (selecionados: string[]) => void;
  placeholder?: string;
  limiteParaBusca?: number;
}

export function MultiSelecao({
  id,
  titulo,
  opcoes,
  selecionados,
  aoAlterar,
  placeholder = "Selecionar",
  limiteParaBusca = 10,
}: PropsMultiSelecao) {
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    if (!busca.trim()) return opcoes;
    const termo = removerAcentos(busca);
    return opcoes.filter((opcao) => removerAcentos(opcao).includes(termo));
  }, [opcoes, busca]);

  function alternar(opcao: string) {
    aoAlterar(
      selecionados.includes(opcao)
        ? selecionados.filter((item) => item !== opcao)
        : [...selecionados, opcao],
    );
  }

  return (
    <>
      <button
        id={id}
        type="button"
        className={`multi-gatilho ${selecionados.length > 0 ? "multi-gatilho--preenchido" : ""}`.trim()}
        onClick={() => {
          setBusca("");
          setAberta(true);
        }}
      >
        <span className="multi-gatilho__texto">
          {selecionados.length > 0
            ? `${selecionados.length} selecionado${selecionados.length > 1 ? "s" : ""}`
            : placeholder}
        </span>
        <Icone nome="seta_baixo" tamanho={18} />
      </button>

      {/* O que já foi escolhido fica visível fora da folha, e cada
          etiqueta remove no toque — evita reabrir só para desmarcar */}
      {selecionados.length > 0 && (
        <div className="etiquetas multi-escolhidos">
          {selecionados.map((item) => (
            <button
              key={item}
              type="button"
              className="etiqueta etiqueta--marca multi-escolhido"
              onClick={() => alternar(item)}
            >
              {item}
              <Icone nome="fechar" tamanho={12} />
            </button>
          ))}
        </div>
      )}

      <Folha
        aberta={aberta}
        titulo={titulo}
        etiqueta={`${selecionados.length} selecionado${selecionados.length === 1 ? "" : "s"}`}
        aoFechar={() => setAberta(false)}
        alta={opcoes.length > limiteParaBusca}
        rodape={
          <>
            <Botao
              variante="contorno"
              onClick={() => aoAlterar([])}
              disabled={selecionados.length === 0}
            >
              Limpar
            </Botao>
            <Botao variante="primario" onClick={() => setAberta(false)}>
              Pronto
            </Botao>
          </>
        }
      >
        {opcoes.length >= limiteParaBusca && (
          <div className="multi-busca">
            <Icone nome="alvo" tamanho={18} />
            <input
              type="text"
              className="multi-busca__entrada"
              placeholder="Filtrar..."
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
            {busca && (
              <button
                type="button"
                className="multi-busca__limpar"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
              >
                <Icone nome="fechar" tamanho={16} />
              </button>
            )}
          </div>
        )}

        <div className="opcoes-pilha">
          {filtradas.length === 0 && (
            <p className="texto-fraco texto-centro texto-pequeno">
              Nenhuma opção encontrada.
            </p>
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
      </Folha>
    </>
  );
}
