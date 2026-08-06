// ================================================================
// DIAS SALVOS (mobile)
// Lista compacta na tela de escolha do relatório: mostra o que já
// foi registrado nesta semana, sem ocupar uma tela inteira.
// ================================================================

import { BotaoIcone } from "@/componentes/ui/Botao";
import { Icone } from "@/componentes/ui/Icone";
import { calcularTotaisDia } from "@cativa/nucleo/regras";
import { formatarData, formatarMoeda } from "@cativa/nucleo/utils";
import { useDiasSalvos } from "@/hooks/useDiasSalvos";

export function PainelDiasSalvos() {
  const { dias, carregando, excluir } = useDiasSalvos();

  if (carregando || dias.length === 0) return null;

  return (
    <section className="dias-salvos">
      <h2 className="dias-salvos__titulo">
        <span>Dias salvos</span>
        <span className="etiqueta etiqueta--neutra">{dias.length}</span>
      </h2>

      {[...dias].reverse().map((dia) => {
        const totais = calcularTotaisDia(dia.trajetos, dia.despesas);
        const dataReferencia = dia.visita.data || dia.trajetos[0]?.data || "";

        const partes: string[] = [];
        if (dia.trajetos.length) partes.push(`${totais.kmRodado} km`);
        if (dia.despesas.length) partes.push(`${dia.despesas.length} gasto(s)`);
        if (dia.agenciasVisitadas.length) {
          partes.push(`${dia.agenciasVisitadas.length} agência(s)`);
        }

        return (
          <article key={dia.id} className="dia-salvo">
            <Icone nome="calendario" tamanho={18} className="texto-fraco" />

            <div className="dia-salvo__texto">
              <span className="dia-salvo__data">
                {dataReferencia ? formatarData(dataReferencia) : "Sem data"}
              </span>
              <span className="dia-salvo__detalhe">
                {partes.join(" · ") || "Sem lançamentos"}
              </span>
            </div>

            <span className="dia-salvo__valor">
              {formatarMoeda(totais.totalFinal)}
            </span>

            <BotaoIcone
              icone="lixeira"
              rotulo="Excluir dia salvo"
              perigo
              onClick={() => void excluir(dia.id)}
            />
          </article>
        );
      })}
    </section>
  );
}
