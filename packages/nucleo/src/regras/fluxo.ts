// ================================================================
// REGRA — NAVEGAÇÃO ENTRE ETAPAS
// Decide quais abas aparecem na trilha e qual vem antes/depois,
// considerando que o executivo pode preencher os DOIS relatórios
// no mesmo dia.
// ================================================================

import { FLUXOS, ORDEM_GERAL_ETAPAS } from "../config/index.ts";
import type { NomeEtapa, NomeFluxo } from "../tipos/index.ts";

/**
 * Etapas visíveis na trilha: Identificação e Resumo sempre,
 * mais as etapas de cada relatório já adicionado ao dia.
 */
export function obterEtapasVisiveis(
  fluxosAdicionados: NomeFluxo[],
): NomeEtapa[] {
  const validas = new Set<NomeEtapa>(["identificacao", "resumo"]);

  fluxosAdicionados.forEach((fluxo) => {
    FLUXOS[fluxo].forEach((etapa) => validas.add(etapa));
  });

  return ORDEM_GERAL_ETAPAS.filter((etapa) => validas.has(etapa));
}

/** Primeira etapa de conteúdo de um relatório (logo após Identificação). */
export function obterEtapaInicial(fluxo: NomeFluxo): NomeEtapa {
  return FLUXOS[fluxo][1];
}

/** Relatórios que ainda não foram preenchidos neste dia. */
export function obterFluxosFaltando(
  fluxosAdicionados: NomeFluxo[],
): NomeFluxo[] {
  return (Object.keys(FLUXOS) as NomeFluxo[]).filter(
    (fluxo) => !fluxosAdicionados.includes(fluxo),
  );
}

/**
 * Estado de um item da trilha em relação à etapa atual.
 * Serve para pintar a bolinha: concluída, atual ou pendente.
 */
export type EstadoEtapa = "concluida" | "atual" | "pendente";

export function obterEstadoEtapa(
  etapa: NomeEtapa,
  etapaAtual: NomeEtapa,
  etapasVisiveis: NomeEtapa[],
): EstadoEtapa {
  const indiceAtual = etapasVisiveis.indexOf(etapaAtual);
  const indiceItem = etapasVisiveis.indexOf(etapa);

  if (indiceItem === indiceAtual) return "atual";
  if (indiceItem !== -1 && indiceItem < indiceAtual) return "concluida";
  return "pendente";
}
