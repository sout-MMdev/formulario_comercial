// ================================================================
// PAINEL DE DIAS SALVOS
// Lista os dias já guardados nesta semana, com o total de cada um
// e a opção de excluir. Fica na tela inicial para o executivo ver
// o que já registrou antes de começar mais um dia.
// ================================================================

import { useState } from "react";
import { Botao, BotaoIcone, Icone, Modal } from "@/componentes/ui";
import { Painel } from "@/componentes/layout";
import { calcularTotaisDia } from "@cativa/nucleo/regras";
import { formatarData, formatarMoeda, juntarLista } from "@cativa/nucleo/utils";
import { useDiasSalvos } from "@/hooks/useDiasSalvos";
import type { DiaSalvo } from "@cativa/nucleo/tipos";
import "./PainelDiasSalvos.css";

export function PainelDiasSalvos() {
  const { dias, carregando, excluir } = useDiasSalvos();
  const [paraExcluir, setParaExcluir] = useState<DiaSalvo | null>(null);

  if (carregando) return null;

  return (
    <>
      <Painel
        etiqueta="Histórico"
        titulo="Dias salvos"
        descricao="Registros guardados neste navegador, aguardando o envio semanal."
        extra={
          dias.length > 0 && (
            <span className="etiqueta etiqueta--marca">
              {dias.length} {dias.length === 1 ? "dia" : "dias"}
            </span>
          )
        }
      >
        {dias.length === 0 ? (
          <div className="estado-vazio">
            <Icone nome="documento" tamanho={22} />
            <span className="estado-vazio__titulo">Nenhum dia salvo ainda</span>
            <span className="estado-vazio__texto">
              Preencha um relatório e clique em “Salvar o dia” — ele aparece
              aqui até o envio do relatório semanal.
            </span>
          </div>
        ) : (
          <ul className="dias anim-cascata">
            {[...dias].reverse().map((dia) => {
              const totais = calcularTotaisDia(dia.trajetos, dia.despesas);
              const dataReferencia =
                dia.visita.data || dia.trajetos[0]?.data || "";

              return (
                <li key={dia.id} className="dias__item">
                  <div className="dias__cabecalho">
                    <div className="dias__data">
                      <Icone nome="calendario" tamanho={15} />
                      <strong>
                        {dataReferencia
                          ? formatarData(dataReferencia)
                          : "Data não informada"}
                      </strong>
                      <span className="dias__salvo-em">
                        salvo em {dia.salvadoEm}
                      </span>
                    </div>

                    <BotaoIcone
                      icone="lixeira"
                      rotulo="Excluir este dia"
                      onClick={() => setParaExcluir(dia)}
                    />
                  </div>

                  <div className="dias__corpo">
                    {dia.trajetos.length > 0 && (
                      <span className="dias__info">
                        <Icone nome="carro" tamanho={14} />
                        {totais.kmRodado} km · {formatarMoeda(totais.totalKm)}
                      </span>
                    )}

                    {dia.despesas.length > 0 && (
                      <span className="dias__info">
                        <Icone nome="carteira" tamanho={14} />
                        {dia.despesas.length}{" "}
                        {dia.despesas.length === 1 ? "despesa" : "despesas"}
                      </span>
                    )}

                    {dia.agenciasVisitadas.length > 0 && (
                      <span className="dias__info">
                        <Icone nome="predio" tamanho={14} />
                        {dia.agenciasVisitadas.length}{" "}
                        {dia.agenciasVisitadas.length === 1
                          ? "agência"
                          : "agências"}
                      </span>
                    )}

                    <span className="dias__total">
                      {formatarMoeda(totais.totalFinal)}
                    </span>
                  </div>

                  {dia.agenciasVisitadas.length > 0 && (
                    <p className="dias__agencias">
                      {juntarLista(dia.agenciasVisitadas)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Painel>

      <Modal
        aberto={paraExcluir !== null}
        etiqueta="Confirmação"
        titulo="Excluir este dia?"
        aoFechar={() => setParaExcluir(null)}
        rodape={
          <>
            <Botao variante="contorno" onClick={() => setParaExcluir(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              icone="lixeira"
              onClick={() => {
                if (paraExcluir) void excluir(paraExcluir.id);
                setParaExcluir(null);
              }}
            >
              Excluir
            </Botao>
          </>
        }
      >
        <p className="texto-suave">
          O registro salvo em <strong>{paraExcluir?.salvadoEm}</strong> será
          apagado deste navegador. Essa ação não pode ser desfeita.
        </p>
      </Modal>
    </>
  );
}
