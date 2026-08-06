// ================================================================
// CONFIG — DESPESAS
// Cartões aceitos e onde o gasto pode ter ocorrido.
// ================================================================

import type { TipoCartao } from "../tipos/index.ts";

/**
 * Cartões disponíveis.
 * `exigeComprovante` decide se o anexo da nota fiscal é obrigatório:
 * no Cartão Pessoal o executivo será reembolsado, então a nota é
 * indispensável. No Cartão Clara a empresa já pagou.
 */
export const cartoes: { valor: TipoCartao; exigeComprovante: boolean }[] = [
  { valor: "Cartão Pessoal", exigeComprovante: true },
  { valor: "Cartão Clara", exigeComprovante: false },
];

/** Onde o gasto ocorreu. */
export const categoriasDespesa: string[] = [
  "Hospedagem",
  "Abastecimento",
  "Pedágio",
  "Refeição",
];

/**
 * Categoria que, quando lançada no Cartão Clara, é DESCONTADA do
 * total a reembolsar — a empresa já pagou o combustível.
 */
export const CATEGORIA_ABASTECIMENTO = "Abastecimento";
