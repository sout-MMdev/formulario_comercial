// ================================================================
// PASSO — TRAJETOS
// Lista de deslocamentos. Cada um é editado em folha, com os
// campos um abaixo do outro e o reembolso calculado na hora.
//
// A tarifa por KM sai de @cativa/nucleo/regras — a mesma conta do
// desktop, sem cópia.
// ================================================================

import { useState } from "react";
import { Botao, BotaoIcone } from "@/componentes/ui/Botao";
import { Campo, EntradaKm, EntradaMoeda } from "@/componentes/ui/Campo";
import { Icone } from "@/componentes/ui/Icone";
import { Folha } from "@/componentes/ui/Folha";
import { SeletorData } from "@/componentes/ui/SeletorData";
import { TelaPasso } from "@/componentes/layout/TelaPasso";
import { CampoLocal } from "@/componentes/campos/CampoLocal";
import { ROTULOS_FLUXO } from "@cativa/nucleo/config";
import { obterTarifaKm, trajetoPreenchido } from "@cativa/nucleo/regras";
import { formatarData, formatarKm, formatarMoeda } from "@cativa/nucleo/utils";
import { useFormulario } from "@/contexto/useFormulario";
import { PASSOS } from "@/navegacao/passos";
import type { Trajeto } from "@cativa/nucleo/tipos";

export function Trajetos() {
  const {
    estado,
    despachar,
    avancar,
    voltar,
    indicePasso,
    sequencia,
    sentido,
    temAnterior,
    totais,
  } = useFormulario();

  const { trajetos, identificacao } = estado;
  const [emEdicao, setEmEdicao] = useState<string | null>(null);

  const trajeto = trajetos.find((item) => item.id === emEdicao) ?? null;
  const tarifa = obterTarifaKm(identificacao.nome);
  const preenchidos = trajetos.filter(trajetoPreenchido);

  function alterar(dados: Partial<Trajeto>) {
    if (!trajeto) return;
    despachar({ tipo: "alterar-trajeto", id: trajeto.id, dados });
  }

  /** Cria um trajeto e já abre o editor — um toque, não dois. */
  function adicionar() {
    despachar({ tipo: "adicionar-trajeto" });
  }

  return (
    <TelaPasso
      etiqueta={ROTULOS_FLUXO.despesas}
      titulo={PASSOS.trajetos.titulo}
      apoio={PASSOS.trajetos.apoio}
      indice={indicePasso}
      total={sequencia.length}
      sentido={sentido}
      temVoltar={temAnterior}
      aoVoltar={voltar}
      aoAvancar={avancar}
      rotuloAvancar={preenchidos.length === 0 ? "Pular esta etapa" : "Continuar"}
    >
      {totais.totalKm > 0 && (
        <div className="resumo-faixa">
          <span className="resumo-faixa__rotulo">
            <Icone nome="carro" tamanho={15} />
            {formatarKm(totais.kmRodado)}
          </span>
          <strong className="resumo-faixa__valor">
            {formatarMoeda(totais.totalKm)}
          </strong>
        </div>
      )}

      <div className="lista">
        {trajetos.map((item, indice) => {
          const vazio = !trajetoPreenchido(item);

          return (
            <div key={item.id} className="linha-item">
              <button
                type="button"
                className="item-lista"
                onClick={() => setEmEdicao(item.id)}
              >
                <span className="item-lista__marca">
                  <Icone nome="carro" tamanho={20} />
                </span>

                <span className="item-lista__texto">
                  <span className="item-lista__titulo">
                    {vazio
                      ? `Trajeto ${indice + 1}`
                      : `${item.partida.split(",")[0] || "?"} → ${item.destino.split(",")[0] || "?"}`}
                  </span>
                  <span className="item-lista__detalhe">
                    {vazio
                      ? "Toque para preencher"
                      : `${formatarData(item.data)} · ${formatarKm(item.km)}`}
                  </span>
                </span>

                {item.reembolsoKm > 0 && (
                  <span className="item-lista__valor">
                    {formatarMoeda(item.reembolsoKm)}
                  </span>
                )}
              </button>

              <BotaoIcone
                icone="lixeira"
                rotulo={`Remover trajeto ${indice + 1}`}
                perigo
                disabled={trajetos.length <= 1}
                onClick={() =>
                  despachar({ tipo: "remover-trajeto", id: item.id })
                }
              />
            </div>
          );
        })}
      </div>

      <Botao variante="adicionar" icone="mais" onClick={adicionar}>
        Adicionar outro trajeto
      </Botao>

      {/* ── Editor ───────────────────────────────────────────── */}
      <Folha
        aberta={trajeto !== null}
        etiqueta="Deslocamento"
        titulo={`Trajeto ${trajetos.findIndex((t) => t.id === emEdicao) + 1}`}
        aoFechar={() => setEmEdicao(null)}
        alta
        rodape={
          <Botao variante="primario" largo onClick={() => setEmEdicao(null)}>
            Pronto
          </Botao>
        }
      >
        {trajeto && (
          <>
            <Campo rotulo="Data" obrigatorio>
              {(id) => (
                <SeletorData
                  id={id}
                  valor={trajeto.data}
                  aoAlterar={(data) => alterar({ data })}
                />
              )}
            </Campo>

            <Campo rotulo="Ponto de partida" obrigatorio>
              {(id) => (
                <CampoLocal
                  id={id}
                  valor={trajeto.partida}
                  aoAlterar={(partida) => alterar({ partida })}
                  placeholder="Cidade de origem"
                  apenasCidade
                />
              )}
            </Campo>

            <Campo rotulo="Destino final" obrigatorio>
              {(id) => (
                <CampoLocal
                  id={id}
                  valor={trajeto.destino}
                  aoAlterar={(destino) => alterar({ destino })}
                  placeholder="Cidade de destino"
                  apenasCidade
                />
              )}
            </Campo>

            <Campo
              rotulo="KM total rodado"
              obrigatorio
              ajuda={`Sua tarifa: ${formatarMoeda(tarifa)} por km.`}
            >
              {(id) => (
                <EntradaKm
                  id={id}
                  valor={trajeto.km}
                  aoAlterar={(km) => alterar({ km })}
                />
              )}
            </Campo>

            <Campo rotulo="Valor do reembolso" ajuda="Calculado automaticamente.">
              {(id) => (
                <EntradaMoeda
                  id={id}
                  valor={trajeto.reembolsoKm}
                  calculado
                  somenteLeitura
                />
              )}
            </Campo>

            {trajeto.km > 0 && (
              <p className="aviso">
                <Icone nome="informacao" tamanho={18} className="aviso__icone" />
                <span>
                  {trajeto.km} km × {formatarMoeda(tarifa)} ={" "}
                  <strong>{formatarMoeda(trajeto.reembolsoKm)}</strong>
                </span>
              </p>
            )}
          </>
        )}
      </Folha>
    </TelaPasso>
  );
}
