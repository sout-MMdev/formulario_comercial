// ================================================================
// UTILS — FORMATADORES
// Funções puras de apresentação: recebem um valor, devolvem texto.
// ================================================================

import { NOMES_MESES } from "../config/index.ts";

// ── Datas ────────────────────────────────────────────────────────

/** "2025-05-05" → "05/05/2025". Vazio vira "—". */
export function formatarData(dataIso: string): string {
  if (!dataIso) return "—";
  return dataIso.split("-").reverse().join("/");
}

/** "2025-05-05" → "5 de Maio de 2025". */
export function formatarDataExtenso(dataIso: string): string {
  if (!dataIso) return "—";
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const nomeMes = NOMES_MESES[mes - 1] ?? "";
  return `${dia} de ${nomeMes} de ${ano}`;
}

/** Data de hoje no formato "YYYY-MM-DD" (fuso local). */
export function dataDeHojeIso(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

/** Monta "YYYY-MM-DD" a partir das partes numéricas. */
export function montarDataIso(dia: number, mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Quantos dias tem o mês (trata fevereiro e anos bissextos). */
export function diasNoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

// ── Moeda e números ──────────────────────────────────────────────

/** 156.5 → "R$ 156,50". */
export function formatarMoeda(valor: string | number): string {
  const numero = typeof valor === "string" ? parseFloat(valor) : valor;

  if (numero === null || numero === undefined || Number.isNaN(numero)) {
    return "R$ 0,00";
  }

  return (
    "R$ " +
    numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** 45 → "45 km". */
export function formatarKm(km: number): string {
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

/** Lê um campo numérico sem quebrar quando está vazio. */
export function paraNumero(valor: string | number): number {
  if (typeof valor === "number") return Number.isNaN(valor) ? 0 : valor;
  const numero = parseFloat(String(valor).replace(",", "."));
  return Number.isNaN(numero) ? 0 : numero;
}

// ── Texto ────────────────────────────────────────────────────────

/** Remove acentos e baixa a caixa — "São Paulo" casa com "sao paulo". */
export function removerAcentos(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** "Aéreo Regular" → "aereo_regular". */
export function paraSlug(texto: string): string {
  return removerAcentos(texto).replace(/\s+/g, "_");
}

/** Junta itens com " · " — o separador padrão do resumo. */
export function juntarLista(itens: string[]): string {
  return itens.filter(Boolean).join(" · ");
}

/** Primeira letra maiúscula, resto como veio. */
export function capitalizar(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
