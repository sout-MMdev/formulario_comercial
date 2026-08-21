// ================================================================
// SERVIÇO — AGÊNCIAS
// Carrega a base de agências (public/agencias.json) e filtra
// para o autocomplete da aba Visita.
// ================================================================

import {
  BUSCA_MAX_RESULTADOS,
  URL_AGENCIAS,
  URL_LISTAR_AGENCIAS,
  SUPABASE_ANON,
  TEM_BACKEND,
} from "../config/index.ts";
import { removerAcentos } from "../utils/index.ts";

let agencias: string[] = [];
let carregado = false;

/**
 * Carrega os nomes das agências e guarda em memória.
 * 1) Com back end: busca da Edge Function `listar-agencias` (base real).
 * 2) Sem back end (ou se a função falhar): usa o fallback fictício
 *    public/agencias.json.
 * Se tudo falhar, o campo simplesmente funciona como texto livre.
 */
export async function carregarAgencias(): Promise<void> {
  if (carregado) return;

  // 1) Back end (quando configurado via VITE_SUPABASE_URL/ANON_KEY).
  if (TEM_BACKEND) {
    try {
      const resposta = await fetch(URL_LISTAR_AGENCIAS, {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      });
      if (resposta.ok) {
        agencias = (await resposta.json()) as string[];
        carregado = true;
        return;
      }
    } catch (erro) {
      console.warn("Back end de agências indisponível; usando fallback.", erro);
    }
  }

  // 2) Fallback: JSON fictício embarcado (portfólio/offline).
  try {
    const resposta = await fetch(URL_AGENCIAS);
    if (!resposta.ok) {
      throw new Error("Arquivo agencias.json não encontrado.");
    }
    agencias = (await resposta.json()) as string[];
    carregado = true;
  } catch (erro) {
    console.warn(
      "Não foi possível carregar as agências. " +
        "O campo funcionará como texto livre.",
      erro,
    );
  }
}

/** Quantas agências estão em memória. */
export function totalAgencias(): number {
  return agencias.length;
}

/** Agências que contêm o texto digitado (ignora acentos e caixa). */
export function filtrarAgencias(textoBusca: string): string[] {
  const busca = removerAcentos(textoBusca.trim());
  if (!busca) return [];

  return agencias
    .filter((agencia) => removerAcentos(agencia).includes(busca))
    .slice(0, BUSCA_MAX_RESULTADOS);
}
