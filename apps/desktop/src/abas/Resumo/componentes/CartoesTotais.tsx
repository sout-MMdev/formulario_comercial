// ================================================================
// CARTÕES DE TOTAIS
// O fechamento financeiro do dia, na ordem em que a conta é feita:
//
//   Reembolso de KM
// + Despesas no Cartão Pessoal
// − Abastecimento no Cartão Clara
// = Total a reembolsar
// ================================================================

import { Icone } from "@/componentes/ui";
import { formatarKm, formatarMoeda } from "@cativa/nucleo/utils";
import type { TotaisDia } from "@cativa/nucleo/tipos";

interface PropsCartoesTotais {
  totais: TotaisDia;
}

export function CartoesTotais({ totais }: PropsCartoesTotais) {
  return (
    <div className="totais">
      <div className="totais__item">
        <span className="totais__rotulo">
          <Icone nome="carro" tamanho={13} />
          Reembolso de KM
        </span>
        <strong className="totais__valor">
          {formatarMoeda(totais.totalKm)}
        </strong>
        {totais.kmRodado > 0 && (
          <span className="totais__nota">{formatarKm(totais.kmRodado)}</span>
        )}
      </div>

      <div className="totais__item">
        <span className="totais__rotulo">
          <Icone nome="carteira" tamanho={13} />
          Cartão Pessoal
        </span>
        <strong className="totais__valor totais__valor--soma">
          + {formatarMoeda(totais.totalPessoal)}
        </strong>
        <span className="totais__nota">Reembolsado a você</span>
      </div>

      <div className="totais__item">
        <span className="totais__rotulo">
          <Icone nome="alerta" tamanho={13} />
          Abastecimento Clara
        </span>
        <strong className="totais__valor totais__valor--desconto">
          − {formatarMoeda(totais.totalAbastecimentoClara)}
        </strong>
        <span className="totais__nota">Já pago pela empresa</span>
      </div>

      <div className="totais__item totais__item--destaque">
        <span className="totais__rotulo">
          <Icone nome="sucesso" tamanho={13} />
          Total a reembolsar
        </span>
        <strong className="totais__valor totais__valor--forte">
          {formatarMoeda(totais.totalFinal)}
        </strong>
      </div>
    </div>
  );
}
