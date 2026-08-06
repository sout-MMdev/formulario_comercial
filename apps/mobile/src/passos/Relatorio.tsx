// ================================================================
// PASSO — QUAL RELATÓRIO
// Dois cartões grandes. Tocar em um já leva ao primeiro passo
// daquele relatório: não existe "escolher e depois continuar",
// que seriam dois toques para uma decisão só.
// ================================================================

import { Icone, type NomeIcone } from "@/componentes/ui/Icone";
import { TelaPasso } from "@/componentes/layout/TelaPasso";
import { ROTULOS_FLUXO } from "@cativa/nucleo/config";
import { useFormulario } from "@/contexto/useFormulario";
import { PASSOS } from "@/navegacao/passos";
import type { NomeFluxo } from "@cativa/nucleo/tipos";
import { PainelDiasSalvos } from "./PainelDiasSalvos";
import "./Relatorio.css";

const OPCOES: {
  fluxo: NomeFluxo;
  icone: NomeIcone;
  descricao: string;
  passos: string;
}[] = [
  {
    fluxo: "despesas",
    icone: "carteira",
    descricao: "Trajetos rodados e gastos com comprovante.",
    passos: "2 telas",
  },
  {
    fluxo: "visita",
    icone: "predio",
    descricao: "Agências visitadas e o termômetro de cada uma.",
    passos: "3 telas",
  },
];

export function Relatorio() {
  const {
    escolherRelatorio,
    voltar,
    indicePasso,
    sequencia,
    sentido,
    temAnterior,
  } = useFormulario();

  return (
    <TelaPasso
      titulo={PASSOS.relatorio.titulo}
      apoio={PASSOS.relatorio.apoio}
      indice={indicePasso}
      total={sequencia.length}
      sentido={sentido}
      temVoltar={temAnterior}
      aoVoltar={voltar}
    >
      <div className="opcoes-relatorio">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.fluxo}
            type="button"
            className="relatorio-cartao"
            onClick={() => escolherRelatorio(opcao.fluxo)}
          >
            <span className="relatorio-cartao__icone">
              <Icone nome={opcao.icone} tamanho={26} />
            </span>

            <span className="relatorio-cartao__texto">
              <span className="relatorio-cartao__nome">
                {ROTULOS_FLUXO[opcao.fluxo]}
              </span>
              <span className="relatorio-cartao__descricao">
                {opcao.descricao}
              </span>
              <span className="etiqueta etiqueta--neutra">{opcao.passos}</span>
            </span>

            <Icone
              nome="seta_direita"
              tamanho={20}
              className="relatorio-cartao__seta"
            />
          </button>
        ))}
      </div>

      <PainelDiasSalvos />
    </TelaPasso>
  );
}
