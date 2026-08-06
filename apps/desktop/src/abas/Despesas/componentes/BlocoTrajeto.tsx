// ================================================================
// BLOCO DE TRAJETO
// Um deslocamento: data, origem, destino, KM e o reembolso —
// que é calculado pelo sistema, nunca digitado.
// ================================================================

import {
  BotaoIcone,
  Campo,
  Entrada,
  EntradaMoeda,
  Icone,
  SeletorData,
} from "@/componentes/ui";
import { CampoLocal } from "@/componentes/campos";
import { obterTarifaKm } from "@cativa/nucleo/regras";
import { formatarMoeda } from "@cativa/nucleo/utils";
import type { Trajeto } from "@cativa/nucleo/tipos";

interface PropsBlocoTrajeto {
  trajeto: Trajeto;
  ordem: number;
  nomeExecutivo: string;
  podeRemover: boolean;
  aoAlterar: (dados: Partial<Trajeto>) => void;
  aoRemover: () => void;
}

export function BlocoTrajeto({
  trajeto,
  ordem,
  nomeExecutivo,
  podeRemover,
  aoAlterar,
  aoRemover,
}: PropsBlocoTrajeto) {
  const tarifa = obterTarifaKm(nomeExecutivo);

  return (
    <article className="bloco">
      <header className="bloco__cabecalho">
        <div className="bloco__identificacao">
          <span className="bloco__ordem">{ordem}</span>
          <span className="bloco__titulo">
            Trajeto {ordem}
            {trajeto.partida && trajeto.destino && (
              <span className="bloco__legenda">
                {" "}
                · {trajeto.partida.split(",")[0]} →{" "}
                {trajeto.destino.split(",")[0]}
              </span>
            )}
          </span>
        </div>

        <BotaoIcone
          icone="lixeira"
          rotulo="Remover trajeto"
          disabled={!podeRemover}
          onClick={aoRemover}
        />
      </header>

      <div className="bloco__corpo">
        <div className="grade-campos grade-campos--2">
          <Campo rotulo="Data" obrigatorio>
            {(id) => (
              <SeletorData
                id={id}
                valor={trajeto.data}
                aoAlterar={(data) => aoAlterar({ data })}
              />
            )}
          </Campo>
        </div>

        <div className="grade-campos grade-campos--2">
          <Campo rotulo="Ponto de partida" obrigatorio>
            {(id) => (
              <CampoLocal
                id={id}
                valor={trajeto.partida}
                aoAlterar={(partida) => aoAlterar({ partida })}
                placeholder="Cidade de origem..."
              />
            )}
          </Campo>

          <Campo rotulo="Destino final" obrigatorio>
            {(id) => (
              <CampoLocal
                id={id}
                valor={trajeto.destino}
                aoAlterar={(destino) => aoAlterar({ destino })}
                placeholder="Cidade de destino..."
              />
            )}
          </Campo>
        </div>

        <div className="grade-campos grade-campos--2">
          <Campo
            rotulo="KM total rodado"
            obrigatorio
            ajuda={`Tarifa aplicada: ${formatarMoeda(tarifa)} por km.`}
          >
            {(id) => (
              <Entrada
                id={id}
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Ex.: 45"
                value={trajeto.km ? String(trajeto.km) : ""}
                onChange={(evento) => {
                  const km = parseFloat(evento.target.value);
                  aoAlterar({ km: Number.isNaN(km) ? 0 : km });
                }}
              />
            )}
          </Campo>

          <Campo rotulo="Valor do reembolso" ajuda="Calculado automaticamente.">
            {(id) => (
              <EntradaMoeda
                id={id}
                valor={trajeto.reembolsoKm}
                calculado
                readOnly
                tabIndex={-1}
              />
            )}
          </Campo>
        </div>

        {trajeto.km > 0 && (
          <p className="calculo">
            <Icone nome="informacao" tamanho={14} />
            {trajeto.km} km × {formatarMoeda(tarifa)} ={" "}
            <strong>{formatarMoeda(trajeto.reembolsoKm)}</strong>
          </p>
        )}
      </div>
    </article>
  );
}
