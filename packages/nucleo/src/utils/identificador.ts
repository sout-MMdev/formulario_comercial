// ================================================================
// UTILS — IDENTIFICADOR
// Gera IDs únicos para os itens de lista (trajetos, despesas,
// agências). O React precisa deles como `key`; o índice do array
// não serve, porque muda quando um item do meio é removido.
// ================================================================

let contador = 0;

/**
 * Ex.: gerarId("trajeto") → "trajeto-1719957600000-3"
 * Único dentro da sessão, e legível ao depurar.
 */
export function gerarId(prefixo = "item"): string {
  contador += 1;
  return `${prefixo}-${Date.now().toString(36)}-${contador}`;
}
