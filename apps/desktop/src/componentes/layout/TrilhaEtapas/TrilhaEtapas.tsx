// ================================================================
// TRILHA DE ETAPAS
// Barra de progresso vertical (lateral no desktop, horizontal no
// celular). Mostra o caminho do relatório escolhido e permite
// voltar clicando em uma etapa já concluída.
// ================================================================

import { ROTULOS_ETAPA } from "@cativa/nucleo/config";
import { obterEstadoEtapa } from "@cativa/nucleo/regras";
import { Icone, type NomeIcone } from "@/componentes/ui/Icone";
import type { NomeEtapa } from "@cativa/nucleo/tipos";
import "./TrilhaEtapas.css";

const ICONES: Record<NomeEtapa, NomeIcone> = {
  identificacao: "usuario",
  visita: "mapa",
  agencias: "predio",
  despesas: "carteira",
  resumo: "documento",
};

interface PropsTrilhaEtapas {
  etapas: NomeEtapa[];
  etapaAtual: NomeEtapa;
  aoEscolher: (etapa: NomeEtapa) => void;
}

export function TrilhaEtapas({
  etapas,
  etapaAtual,
  aoEscolher,
}: PropsTrilhaEtapas) {
  if (etapas.length <= 2) return null;

  const indiceAtual = etapas.indexOf(etapaAtual);
  const progresso =
    etapas.length > 1 ? (indiceAtual / (etapas.length - 1)) * 100 : 0;

  return (
    <nav className="trilha" aria-label="Etapas do relatório">
      <span className="trilha__titulo">Seu progresso</span>

      <ol className="trilha__lista">
        {/* Fio que liga as bolinhas + preenchimento até a etapa atual */}
        <span className="trilha__fio" aria-hidden="true">
          <span
            className="trilha__fio-preenchido"
            style={{ "--progresso": `${progresso}%` } as React.CSSProperties}
          />
        </span>

        {etapas.map((etapa) => {
          const estado = obterEstadoEtapa(etapa, etapaAtual, etapas);
          const navegavel = estado === "concluida";

          return (
            <li key={etapa} className={`trilha__item trilha__item--${estado}`}>
              <button
                type="button"
                className="trilha__botao"
                disabled={!navegavel}
                aria-current={estado === "atual" ? "step" : undefined}
                onClick={() => navegavel && aoEscolher(etapa)}
              >
                <span className="trilha__marcador">
                  <Icone
                    nome={estado === "concluida" ? "checar" : ICONES[etapa]}
                    tamanho={14}
                  />
                </span>

                <span className="trilha__rotulo">{ROTULOS_ETAPA[etapa]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
