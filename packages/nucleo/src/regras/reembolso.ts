// ================================================================
// REGRA — REEMBOLSO
// Funções puras: entram números, saem números. Sem DOM, sem React.
// É aqui que mora o dinheiro — qualquer mudança de política de
// reembolso começa e termina neste arquivo.
// ================================================================

import {
  TARIFA_KM_PADRAO,
  TARIFA_KM_ESPECIAL,
  executivosTarifaEspecial,
  CATEGORIA_ABASTECIMENTO,
} from "../config/index.ts";
import type {
  Despesa,
  SituacaoDespesa,
  TotaisDia,
  Trajeto,
} from "../tipos/index.ts";

/**
 * Tarifa por KM do executivo.
 * A maioria recebe a tarifa padrão; alguns têm valor negociado.
 */
export function obterTarifaKm(nomeExecutivo: string): number {
  return executivosTarifaEspecial.has(nomeExecutivo.trim())
    ? TARIFA_KM_ESPECIAL
    : TARIFA_KM_PADRAO;
}

/**
 * Reembolso de um trajeto: KM rodado × tarifa do executivo.
 * Arredonda em 2 casas, como no cálculo original.
 */
export function calcularReembolsoKm(km: number, nomeExecutivo: string): number {
  return calcularReembolsoComTarifa(km, obterTarifaKm(nomeExecutivo));
}

/**
 * Mesmo cálculo, com a tarifa já conhecida. É o que o servidor usa:
 * a tarifa vem do cadastro do executivo no banco, não da lista do front.
 */
export function calcularReembolsoComTarifa(km: number, tarifa: number): number {
  if (!km || km <= 0) return 0;
  return Number((km * tarifa).toFixed(2));
}

/**
 * Como cada despesa entra na conta:
 *
 *   Cartão Pessoal ................ SOMA (a empresa devolve ao executivo)
 *   Cartão Clara + Abastecimento .. SUBTRAI (a empresa já pagou o combustível,
 *                                    então desconta do reembolso de KM)
 *   Cartão Clara + outras ......... INFORMATIVO (não mexe no total)
 */
export function classificarDespesa(despesa: Despesa): SituacaoDespesa {
  if (despesa.cartao === "Cartão Pessoal") return "reembolsado";

  if (
    despesa.cartao === "Cartão Clara" &&
    despesa.categoria === CATEGORIA_ABASTECIMENTO
  ) {
    return "descontado";
  }

  return "informativo";
}

/** Texto que aparece na tela para cada situação. */
export const ROTULOS_SITUACAO: Record<SituacaoDespesa, string> = {
  reembolsado: "Reembolsado (+)",
  descontado: "Descontado (−)",
  informativo: "Já pago pela empresa (informativo)",
};

/**
 * Variante visual da etiqueta de cada situação — usada como
 * `etiqueta--${variante}`. Mapa explícito no lugar de um ternário
 * repetido em cada tela.
 */
export const VARIANTE_ETIQUETA_SITUACAO: Record<SituacaoDespesa, string> = {
  reembolsado: "sucesso",
  descontado: "atencao",
  informativo: "neutra",
};

/**
 * Fechamento financeiro do dia.
 *
 *   totalFinal = reembolso de KM
 *              + despesas no Cartão Pessoal
 *              − abastecimentos no Cartão Clara
 */
export function calcularTotaisDia(
  trajetos: Trajeto[],
  despesas: Despesa[],
): TotaisDia {
  const totalKm = trajetos.reduce((soma, t) => soma + (t.reembolsoKm || 0), 0);
  const kmRodado = trajetos.reduce((soma, t) => soma + (t.km || 0), 0);

  const totalPessoal = despesas
    .filter((d) => classificarDespesa(d) === "reembolsado")
    .reduce((soma, d) => soma + (d.valor || 0), 0);

  const totalAbastecimentoClara = despesas
    .filter((d) => classificarDespesa(d) === "descontado")
    .reduce((soma, d) => soma + (d.valor || 0), 0);

  return {
    totalKm,
    totalPessoal,
    totalAbastecimentoClara,
    totalFinal: totalKm + totalPessoal - totalAbastecimentoClara,
    kmRodado,
  };
}
