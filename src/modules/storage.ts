// ================================================================
// STORAGE — toda interação com localStorage vive aqui.
// Quando o backend ficar pronto, você troca o conteúdo
// dessas funções por chamadas fetch() e o resto do projeto
// continua funcionando sem nenhuma mudança.
// ================================================================

import { CHAVE_STORAGE } from "../config/dados";
import type { DiaSalvo } from "../types";


/**
 * Retorna todos os dias salvos no localStorage.
 * Se não houver nada salvo, retorna array vazio.
 */
export function carregarDiasSalvos(): DiaSalvo[] {
  const dados = localStorage.getItem(CHAVE_STORAGE);
  if (!dados) return [];

  try {
    return JSON.parse(dados) as DiaSalvo[];
  } catch {
    console.warn("Erro ao ler dias salvos do localStorage.");
    return [];
  }
}


/**
 * Salva um novo dia no final da lista existente.
 * Retorna o array atualizado.
 */
export function salvarDia(registro: DiaSalvo): DiaSalvo[] {
  const dias = carregarDiasSalvos();
  dias.push(registro);
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dias));
  return dias;
}


/**
 * Remove um dia pelo ID (timestamp).
 * Retorna o array atualizado.
 */
export function excluirDia(id: number): DiaSalvo[] {
  const dias = carregarDiasSalvos().filter(
    (dia) => dia.id !== id
  );
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dias));
  return dias;
}


/**
 * Remove todos os dias salvos.
 * Chamada após o envio do relatório semanal.
 */
export function limparTodosDias(): void {
  localStorage.removeItem(CHAVE_STORAGE);
}