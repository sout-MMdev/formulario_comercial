// ================================================================
// CONFIG — FLUXOS E ETAPAS
// Define quais abas cada relatório percorre e como elas aparecem
// na trilha de progresso.
//
//   visita   → Identificação → Visita → Agências → Resumo
//   despesas → Identificação → Despesas → Resumo
//
// Os dois podem ser preenchidos no mesmo dia: ao chegar no Resumo,
// o executivo pode adicionar o relatório que faltou.
// ================================================================

import type { NomeEtapa, NomeFluxo } from "../tipos/index.ts";

/** As etapas de cada fluxo, em ordem. */
export const FLUXOS: Record<NomeFluxo, NomeEtapa[]> = {
  visita: ["identificacao", "visita", "agencias", "resumo"],
  despesas: ["identificacao", "despesas", "resumo"],
};

/** Nome curto de cada etapa (trilha de progresso). */
export const ROTULOS_ETAPA: Record<NomeEtapa, string> = {
  identificacao: "Identificação",
  visita: "Visita",
  agencias: "Agências",
  despesas: "Despesas",
  resumo: "Resumo",
};

/** Frase de apoio de cada etapa (subtítulo do painel). */
export const DESCRICOES_ETAPA: Record<NomeEtapa, string> = {
  identificacao: "Confirme quem está preenchendo e escolha o relatório do dia.",
  visita: "Informe a data e as agências que você visitou.",
  agencias: "Detalhe o perfil comercial e o termômetro de cada agência.",
  despesas: "Lance os trajetos rodados e as despesas com comprovante.",
  resumo: "Confira tudo antes de salvar o dia.",
};

/** Nome completo de cada relatório. */
export const ROTULOS_FLUXO: Record<NomeFluxo, string> = {
  visita: "Relatório de Visita",
  despesas: "Relatório de Despesas",
};

/**
 * Ordem em que as etapas aparecem na trilha quando os DOIS
 * relatórios são preenchidos no mesmo dia.
 */
export const ORDEM_GERAL_ETAPAS: NomeEtapa[] = [
  "identificacao",
  "despesas",
  "visita",
  "agencias",
  "resumo",
];
