// ================================================================
// SERVIÇO — AGÊNCIAS
// Carrega a base de agências (public/agencias.json) e filtra
// para o autocomplete da aba Visita.
// ================================================================

import { BUSCA_MAX_RESULTADOS, URL_AGENCIAS } from "../config/index.ts";
import { removerAcentos } from "../utils/index.ts";

let agencias: string[] = [];
let carregado = false;

/** Lê o JSON de agências e guarda em memória. */
export async function carregarAgencias(): Promise<void> {
  if (carregado) return;

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
