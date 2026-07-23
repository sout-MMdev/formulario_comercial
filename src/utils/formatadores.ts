// ================================================================
// FORMATADORES — funções utilitárias puras (recebem um valor,
// retornam outro, sem efeitos colaterais). Usadas em vários
// módulos diferentes do projeto.
// ================================================================


// ── Datas ─────────────────────────────────────────────────────────

/**
 * Converte "2025-05-05" → "05/05/2025".
 * Se a data estiver vazia, retorna "—".
 */
export function formatarData(dataIso: string): string {
  if (!dataIso) return "—";
  return dataIso.split("-").reverse().join("/");
}


// ── Moeda ─────────────────────────────────────────────────────────

/**
 * Converte 156.5 → "R$ 156,50".
 * Se o valor for vazio ou zero, retorna "R$ 0,00".
 */
export function formatarMoeda(valor: string | number): string {
  const numero = typeof valor === "string" ? parseFloat(valor) : valor;

  if (!numero && numero !== 0) return "R$ 0,00";

  return "R$ " + numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


// ── Texto ─────────────────────────────────────────────────────────

/**
 * Remove acentos e converte para minúsculo.
 * Permite buscar "sao paulo" e encontrar "São Paulo".
 */
export function removerAcentos(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Transforma texto em slug para uso em atributos name/id.
 * "Aéreo Regular" → "aereo_regular"
 */
export function slugTexto(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


// ── HTML ──────────────────────────────────────────────────────────

/**
 * Escapa aspas duplas para uso seguro dentro de atributos HTML.
 * Evita quebrar o value="" quando o nome da agência contém aspas.
 */
export function escaparHtml(texto: string): string {
  return texto.replace(/"/g, "&quot;");
}

/**
 * Monta uma linha "Label: Valor" usada nos cards do resumo.
 */
export function resumoLinha(label: string, valor: string): string {
  return (
    '<div class="resumo-linha">' +
      '<span class="resumo-chave">' + label + ':</span>' +
      '<span class="resumo-valor">'  + valor  + '</span>' +
    '</div>'
  );
}