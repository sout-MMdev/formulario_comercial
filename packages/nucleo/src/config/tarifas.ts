// ================================================================
// CONFIG — TARIFAS DE QUILOMETRAGEM
// Valor pago por KM rodado. Alterar a tarifa de um ano para o
// outro é mexer em uma linha só deste arquivo.
// ================================================================

/** Tarifa aplicada à maioria dos executivos. */
export const TARIFA_KM_PADRAO = 1.3;

/** Tarifa diferenciada, negociada individualmente. */
export const TARIFA_KM_ESPECIAL = 1.43;

/** Quem recebe a tarifa especial. */
export const executivosTarifaEspecial = new Set<string>([
  "ADRIANA SCHLICHTA",
  "DANIELA REIS",
  "MARCOS TRE",
  "PABLO SANTANA",
  "RAFAEL ANDRADE",
]);
