// ================================================================
// REGRA — TERMÔMETRO DE SATISFAÇÃO
// Validação de um registro de estresse antes de ele ser aceito.
// ================================================================

import { niveisEstresse } from "../config/index.ts";
import type { NomeNivelEstresse } from "../tipos/index.ts";

/** Busca a definição completa de um nível. */
export function obterNivel(nome: NomeNivelEstresse | "") {
  return niveisEstresse.find((nivel) => nivel.nome === nome) ?? null;
}

/** O nível exige que o executivo descreva o ocorrido? */
export function exigeDescricao(nome: NomeNivelEstresse | ""): boolean {
  return obterNivel(nome)?.exigeDescricao ?? false;
}

/** Resultado de uma validação: ou passa, ou tem um motivo. */
export interface ResultadoValidacao {
  valido: boolean;
  erro: string | null;
}

const OK: ResultadoValidacao = { valido: true, erro: null };

/**
 * Um registro só pode ser adicionado quando:
 *   1. um nível foi escolhido;
 *   2. pelo menos um setor está marcado;
 *   3. a descrição está preenchida, se o nível exigir.
 */
export function validarRegistroEstresse(entrada: {
  nivel: NomeNivelEstresse | "";
  setores: string[];
  descricao: string;
}): ResultadoValidacao {
  if (!entrada.nivel) {
    return { valido: false, erro: "Escolha o nível de estresse." };
  }

  if (entrada.setores.length === 0) {
    return {
      valido: false,
      erro: "Selecione pelo menos um setor antes de adicionar o registro.",
    };
  }

  if (exigeDescricao(entrada.nivel) && !entrada.descricao.trim()) {
    return {
      valido: false,
      erro: "Preencha a descrição antes de adicionar o registro.",
    };
  }

  return OK;
}
