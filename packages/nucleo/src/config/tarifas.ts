// ================================================================
// CONFIG — TARIFAS DE QUILOMETRAGEM
// Valor pago por KM rodado. Alterar a tarifa de um ano para o
// outro é mexer em uma linha só deste arquivo.
//
// Os nomes da tarifa especial são FICTÍCIOS (fallback). Em produção,
// quem tem tarifa especial vem do back end — nenhum dado de
// remuneração de pessoa real fica no repositório (LGPD).
// ================================================================

/** Tarifa aplicada à maioria dos executivos. */
export const TARIFA_KM_PADRAO = 1.3;

/** Tarifa diferenciada, negociada individualmente. */
export const TARIFA_KM_ESPECIAL = 1.43;

/** Quem recebe a tarifa especial (nomes fictícios). */
export const executivosTarifaEspecial = new Set<string>([
  "BRUNO ROCHA",
  "DIEGO MARTINS",
  "CARLOS NUNES",
  "FERNANDA LIMA",
  "RENATA DIAS",
]);
