// ================================================================
// AÇÕES ACORDADAS
// Marcar um setor abre o campo do que foi combinado com ele.
// Desmarcar apaga o texto — mesma regra da v1.
// ================================================================

import { AreaTexto } from "@/componentes/ui";
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

  function escrever(setor: string, detalhe: string) {
    aoAlterar(
      acoes.map((acao) => (acao.setor === setor ? { ...acao, detalhe } : acao)),
    );
  }

  return (
    <div className="acoes-acordadas">
      {setoresAcao.map((setor) => {
        const acao = acoes.find((item) => item.setor === setor);
        const marcado = acao !== undefined;

        return (
          <div key={setor} className="acoes-acordadas__item">
            <label
              className={`opcao ${marcado ? "opcao--marcada" : ""}`.trim()}
            >
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
                rows={2}
                className="anim-surgir"
                placeholder={`O que foi combinado com ${setor}?`}
                value={acao.detalhe}
                onChange={(evento) => escrever(setor, evento.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
