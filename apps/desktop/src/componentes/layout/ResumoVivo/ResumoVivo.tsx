// ================================================================
// RESUMO AO VIVO — coluna direita (Modelo "Assistente guiado")
// Mostra os totais do dia se montando em tempo real enquanto o
// executivo preenche: agências, reembolso de KM, cartões e o total.
// Usa o MESMO cálculo do Resumo (os totais vêm do contexto), então
// nunca diverge do fechamento final.
// ================================================================

import { useFormulario } from "@/contexto/useFormulario";
import { Icone } from "@/componentes/ui";
import { formatarData, formatarKm, formatarMoeda } from "@cativa/nucleo/utils";
import "./ResumoVivo.css";

export function ResumoVivo() {
  const { totais, agenciasVisitadas, estado } = useFormulario();

  // Tem algum valor financeiro? (aí mostra o detalhamento KM/cartões)
  const temFinanceiro =
    totais.totalKm !== 0 ||
    totais.totalPessoal !== 0 ||
    totais.totalAbastecimentoClara !== 0 ||
    totais.totalFinal !== 0;

  const temAgencias = agenciasVisitadas.length > 0;
  const vazio = !temAgencias && !temFinanceiro;
  const dataRef = estado.visita.data ? formatarData(estado.visita.data) : "";

  return (
    <aside className="resumo-vivo" aria-label="Resumo do dia">
      <div className="resumo-vivo__topo">
        <span className="resumo-vivo__titulo">Resumo do dia</span>
        {dataRef && <span className="resumo-vivo__data">{dataRef}</span>}
      </div>

      {vazio ? (
        <div className="resumo-vivo__vazio">
          <Icone nome="documento" tamanho={20} />
          <span>Seu resumo aparece aqui conforme você preenche o dia.</span>
        </div>
      ) : (
        <>
          <ul className="resumo-vivo__linhas">
            {temAgencias && (
              <li className="resumo-vivo__linha">
                <span className="resumo-vivo__rot">
                  <Icone nome="predio" tamanho={15} /> Agências
                </span>
                <span className="resumo-vivo__val">{agenciasVisitadas.length}</span>
              </li>
            )}

            {temFinanceiro && (
              <>
                <li className="resumo-vivo__linha">
                  <span className="resumo-vivo__rot">
                    <Icone nome="carro" tamanho={15} /> Reembolso de KM
                  </span>
                  <span className="resumo-vivo__val">
                    {formatarMoeda(totais.totalKm)}
                    {totais.kmRodado > 0 && (
                      <small className="resumo-vivo__nota">
                        {formatarKm(totais.kmRodado)}
                      </small>
                    )}
                  </span>
                </li>

                <li className="resumo-vivo__linha">
                  <span className="resumo-vivo__rot">
                    <Icone nome="carteira" tamanho={15} /> Cartão Pessoal
                  </span>
                  <span className="resumo-vivo__val resumo-vivo__val--soma">
                    + {formatarMoeda(totais.totalPessoal)}
                  </span>
                </li>

                <li className="resumo-vivo__linha">
                  <span className="resumo-vivo__rot">
                    <Icone nome="alerta" tamanho={15} /> Abastec. Clara
                  </span>
                  <span className="resumo-vivo__val resumo-vivo__val--desconto">
                    − {formatarMoeda(totais.totalAbastecimentoClara)}
                  </span>
                </li>
              </>
            )}
          </ul>

          <div className="resumo-vivo__total">
            <span>Total a reembolsar</span>
            <strong>{formatarMoeda(totais.totalFinal)}</strong>
          </div>
        </>
      )}
    </aside>
  );
}
