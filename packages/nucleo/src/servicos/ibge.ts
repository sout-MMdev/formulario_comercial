// ================================================================
// SERVIÇO — IBGE
// Carrega a lista de municípios do Brasil uma única vez e mantém
// em memória para o autocomplete filtrar sem ir à rede.
// ================================================================

import {
  BUSCA_MAX_RESULTADOS,
  URL_IBGE_MUNICIPIOS,
} from "../config/index.ts";
import { removerAcentos } from "../utils/index.ts";
import type { Cidade } from "../tipos/index.ts";

let cidades: Cidade[] = [];
let carregado = false;

/**
 * Busca todos os municípios na API do IBGE.
 * Se falhar, o campo continua funcionando como texto livre.
 */
export async function carregarCidades(): Promise<void> {
  if (carregado) return;

  try {
    const resposta = await fetch(URL_IBGE_MUNICIPIOS);
    const dados = (await resposta.json()) as Record<string, string>[];

    cidades = dados.map((item) => ({
      nome: item["municipio-nome"],
      estado: item["UF-sigla"],
      label: `${item["municipio-nome"]} - ${item["UF-sigla"]}`,
    }));

    carregado = true;
  } catch (erro) {
    console.warn(
      "Não foi possível carregar as cidades do IBGE. " +
        "Os campos de cidade funcionarão como texto livre.",
      erro,
    );
  }
}

/** Quantos municípios estão em memória. */
export function totalCidades(): number {
  return cidades.length;
}

/** Municípios cujo rótulo contém o texto digitado (ignora acentos). */
export function filtrarCidades(textoBusca: string): Cidade[] {
  const busca = removerAcentos(textoBusca.trim());
  if (!busca) return [];

  return cidades
    .filter((cidade) => removerAcentos(cidade.label).includes(busca))
    .slice(0, BUSCA_MAX_RESULTADOS);
}
