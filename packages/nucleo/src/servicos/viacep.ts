// ================================================================
// SERVIÇO — VIACEP
// Busca logradouros dentro de uma cidade já escolhida.
// É a 2ª fase do autocomplete de endereço.
// ================================================================

import {
  BUSCA_MAX_RESULTADOS,
  RUAS_TAMANHO_MINIMO,
  URL_VIACEP,
} from "../config/index.ts";
import type { Endereco, Rua } from "../tipos/index.ts";

/** Um endereço em branco — base para inicializar o estado. */
export function enderecoVazio(): Endereco {
  return {
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  };
}

/** Mantém só os dígitos do CEP (remove "-", espaços, etc.). */
export function apenasDigitosCep(cep: string): string {
  return cep.replace(/\D/g, "").slice(0, 8);
}

/**
 * Busca o endereço completo a partir do CEP (logradouro, bairro,
 * cidade e UF). Número e complemento continuam em branco — o ViaCEP
 * não os fornece. Retorna null se o CEP for inválido ou não existir,
 * para o executivo poder preencher à mão.
 */
export async function buscarEnderecoPorCep(
  cep: string,
): Promise<Endereco | null> {
  const digitos = apenasDigitosCep(cep);
  if (digitos.length !== 8) return null;

  try {
    const resposta = await fetch(`${URL_VIACEP}/${digitos}/json/`);
    const dados = await resposta.json();

    // O ViaCEP responde { erro: true } quando o CEP não existe.
    if (!dados || dados.erro) return null;

    return {
      cep: dados.cep ?? digitos,
      logradouro: dados.logradouro ?? "",
      numero: "",
      complemento: "",
      bairro: dados.bairro ?? "",
      cidade: dados.localidade ?? "",
      uf: dados.uf ?? "",
    };
  } catch (erro) {
    console.warn("Não foi possível buscar o endereço no ViaCEP.", erro);
    return null;
  }
}

/**
 * Consulta o ViaCEP por UF + cidade + trecho do nome da rua.
 * Retorna lista vazia em qualquer erro — o campo segue como
 * texto livre e o executivo não fica travado.
 */
export async function buscarRuas(
  uf: string,
  cidade: string,
  textoBusca: string,
): Promise<Rua[]> {
  const busca = textoBusca.trim();

  if (!uf || !cidade || busca.length < RUAS_TAMANHO_MINIMO) return [];

  try {
    const url =
      `${URL_VIACEP}/` +
      `${encodeURIComponent(uf)}/` +
      `${encodeURIComponent(cidade)}/` +
      `${encodeURIComponent(busca)}/json/`;

    const resposta = await fetch(url);
    const dados = await resposta.json();

    // O ViaCEP responde { erro: true } quando não encontra nada.
    if (!Array.isArray(dados)) return [];

    return dados
      .slice(0, BUSCA_MAX_RESULTADOS)
      .map((item: Record<string, string>) => ({
        rua: item.logradouro,
        bairro: item.bairro,
        cep: item.cep,
        label: item.logradouro + (item.bairro ? ` - ${item.bairro}` : ""),
      }));
  } catch (erro) {
    console.warn("Não foi possível buscar ruas no ViaCEP.", erro);
    return [];
  }
}
