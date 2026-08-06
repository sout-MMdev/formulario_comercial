// ================================================================
// PASSO — ANÁLISE DAS AGÊNCIAS
// Lista as agências do passo anterior. Tocar em uma abre um editor
// em tela quase cheia com perfil, termômetro e ações.
//
// Por que editor em folha e não mais um passo por agência: com 4
// agências viraria uma sequência de 12 telas, e o executivo perde
// a noção de onde está. Aqui a lista é o mapa, e o editor é o
// detalhe — dá para preencher em qualquer ordem.
// ================================================================

import { useState } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { Campo, Selecao } from "@/componentes/ui/Campo";
import { Icone } from "@/componentes/ui/Icone";
import { Folha } from "@/componentes/ui/Folha";
import { MultiSelecao } from "@/componentes/ui/MultiSelecao";
import { SeletorData } from "@/componentes/ui/SeletorData";
import { TelaPasso } from "@/componentes/layout/TelaPasso";
import {
  faturamentoAnualOpcoes,
  listaAtendentes,
  produtosAgencia,
  ROTULOS_FLUXO,
} from "@cativa/nucleo/config";
import { useFormulario } from "@/contexto/useFormulario";
import { PASSOS } from "@/navegacao/passos";
import type { AgenciaComercial } from "@cativa/nucleo/tipos";
import { CampoEndereco } from "@/componentes/campos/CampoEndereco";
import { AcoesAcordadas } from "./componentes/AcoesAcordadas";
import { Termometro } from "./componentes/Termometro";
import "./Analise.css";

/** Quantos dos 5 blocos daquela agência já foram preenchidos. */
function contarPreenchidos(agencia: AgenciaComercial): number {
  return [
    Boolean(agencia.dataFundacao),
    Boolean(agencia.faturamentoAnual),
    agencia.produtos.length > 0,
    agencia.atendentes.length > 0,
    agencia.estresses.length > 0,
  ].filter(Boolean).length;
}

export function Analise() {
  const {
    estado,
    despachar,
    avancar,
    voltar,
    indicePasso,
    sequencia,
    sentido,
    temAnterior,
  } = useFormulario();

  const { agenciasComercial } = estado;
  const [emEdicao, setEmEdicao] = useState<string | null>(null);

  const agencia = agenciasComercial.find((item) => item.id === emEdicao) ?? null;

  function alterar(dados: Partial<AgenciaComercial>) {
    if (!agencia) return;
    despachar({
      tipo: "alterar-agencia-comercial",
      id: agencia.id,
      dados,
    });
  }

  return (
    <TelaPasso
      etiqueta={ROTULOS_FLUXO.visita}
      titulo={PASSOS.analise.titulo}
      apoio={PASSOS.analise.apoio}
      indice={indicePasso}
      total={sequencia.length}
      sentido={sentido}
      temVoltar={temAnterior}
      aoVoltar={voltar}
      aoAvancar={avancar}
      rotuloAvancar="Ir para o resumo"
    >
      {agenciasComercial.length === 0 ? (
        <div className="vazio">
          <span className="vazio__icone">
            <Icone nome="predio" tamanho={24} />
          </span>
          <span className="vazio__titulo">Nenhuma agência na lista</span>
          <span className="vazio__texto">
            Volte um passo e informe pelo menos uma agência visitada.
          </span>
        </div>
      ) : (
        <>
          <p className="aviso">
            <Icone nome="informacao" tamanho={18} className="aviso__icone" />
            <span>
              Preenchimento opcional — mas é o termômetro que mostra à gestão
              o risco de perder a conta.
            </span>
          </p>

          <div className="lista">
            {agenciasComercial.map((item) => {
              const preenchidos = contarPreenchidos(item);
              // Mostra o nível do último registro — é o retrato
              // mais recente da relação com aquela agência.
              const ultimoNivel =
                item.estresses[item.estresses.length - 1]?.nivel;

              return (
                <button
                  key={item.id}
                  type="button"
                  className="item-lista"
                  onClick={() => setEmEdicao(item.id)}
                >
                  <span className="item-lista__marca">
                    <Icone nome="predio" tamanho={20} />
                  </span>

                  <span className="item-lista__texto">
                    <span className="item-lista__titulo">{item.nome}</span>
                    <span className="item-lista__detalhe">
                      {preenchidos === 0
                        ? "Toque para detalhar"
                        : `${preenchidos} de 5 preenchidos`}
                    </span>
                  </span>

                  {ultimoNivel && (
                    <span className="etiqueta" data-nivel={ultimoNivel}>
                      {ultimoNivel}
                    </span>
                  )}

                  <Icone nome="seta_direita" tamanho={18} className="texto-fraco" />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Editor da agência ────────────────────────────────── */}
      <Folha
        aberta={agencia !== null}
        etiqueta="Agência visitada"
        titulo={agencia?.nome ?? ""}
        aoFechar={() => setEmEdicao(null)}
        alta
        rodape={
          <Botao variante="primario" largo onClick={() => setEmEdicao(null)}>
            Concluir agência
          </Botao>
        }
      >
        {agencia && (
          <>
            <section className="secao-agencia">
              <h3 className="secao-agencia__titulo">
                <Icone nome="grafico" tamanho={15} />
                Perfil comercial
              </h3>

              <Campo rotulo="Data de fundação">
                {(id) => (
                  <SeletorData
                    id={id}
                    valor={agencia.dataFundacao}
                    placeholder="Escolher data"
                    aoAlterar={(dataFundacao) => alterar({ dataFundacao })}
                  />
                )}
              </Campo>

              <Campo rotulo="Faturamento anual">
                {(id) => (
                  <Selecao
                    id={id}
                    value={agencia.faturamentoAnual}
                    opcoes={faturamentoAnualOpcoes.map((opcao) => ({
                      valor: opcao.value,
                      rotulo: opcao.label,
                    }))}
                    onChange={(evento) => {
                      const valor = evento.target.value;
                      const opcao = faturamentoAnualOpcoes.find(
                        (item) => item.value === valor,
                      );
                      alterar({
                        faturamentoAnual: valor,
                        faturamentoAnualLabel: opcao?.label ?? "",
                      });
                    }}
                  />
                )}
              </Campo>

              <CampoEndereco
                valor={agencia.endereco}
                aoAlterar={(endereco) => alterar({ endereco })}
              />

              <Campo rotulo="Produtos que mais vende">
                {(id) => (
                  <MultiSelecao
                    id={id}
                    titulo="Produtos"
                    opcoes={produtosAgencia}
                    selecionados={agencia.produtos}
                    aoAlterar={(produtos) => alterar({ produtos })}
                  />
                )}
              </Campo>

              <Campo rotulo="Atendente de preferência">
                {(id) => (
                  <MultiSelecao
                    id={id}
                    titulo="Atendentes"
                    opcoes={listaAtendentes}
                    selecionados={agencia.atendentes}
                    aoAlterar={(atendentes) => alterar({ atendentes })}
                  />
                )}
              </Campo>
            </section>

            <section className="secao-agencia">
              <h3 className="secao-agencia__titulo">
                <Icone nome="termometro" tamanho={15} />
                Termômetro de satisfação
              </h3>

              <Termometro
                registros={agencia.estresses}
                aoAlterar={(estresses) => alterar({ estresses })}
              />
            </section>

            <section className="secao-agencia">
              <h3 className="secao-agencia__titulo">
                <Icone nome="alvo" tamanho={15} />
                Ações acordadas
              </h3>

              <AcoesAcordadas
                acoes={agencia.acoes}
                aoAlterar={(acoes) => alterar({ acoes })}
              />
            </section>
          </>
        )}
      </Folha>
    </TelaPasso>
  );
}
