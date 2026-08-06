// ================================================================
// AÇÕES ACORDADAS (mobile)
// Marcar o setor abre o campo do que foi combinado. Desmarcar
// apaga o texto — mesma regra do desktop.
// ================================================================

import { AreaTexto } from "@/componentes/ui/Campo";
import { setoresAcao } from "@cativa/nucleo/config";
import type { AcaoAcordada } from "@cativa/nucleo/tipos";

interface PropsAcoesAcordadas {
  acoes: AcaoAcordada[];
  aoAlterar: (acoes: AcaoAcordada[]) => void;
}

export function AcoesAcordadas({ acoes, aoAlterar }: PropsAcoesAcordadas) {
  function alternar(setor: string) {
    const jaTem = acoes.some((acao) => acao.setor === setor);

    aoAlterar(
      jaTem
        ? acoes.filter((acao) => acao.setor !== setor)
        : [...acoes, { setor, detalhe: "" }],
    );
  }

  return (
    <div className="opcoes-pilha">
      {setoresAcao.map((setor) => {
        const acao = acoes.find((item) => item.setor === setor);
        const marcado = acao !== undefined;

        return (
          <div key={setor} className="pilha pilha-2">
            <label className={`opcao ${marcado ? "opcao--marcada" : ""}`.trim()}>
              <input
                type="checkbox"
                className="opcao__entrada"
                checked={marcado}
                onChange={() => alternar(setor)}
              />
              <span>{setor}</span>
            </label>

            {marcado && (
              <AreaTexto
                rows={3}
                className="anim-surgir"
                placeholder={`O que foi combinado com ${setor}?`}
                value={acao.detalhe}
                onChange={(evento) =>
                  aoAlterar(
                    acoes.map((item) =>
                      item.setor === setor
                        ? { ...item, detalhe: evento.target.value }
                        : item,
                    ),
                  )
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
