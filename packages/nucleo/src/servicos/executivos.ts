// ================================================================
// SERVIÇO — EXECUTIVOS
// Carrega a lista de executivos (nome + e-mail) do back end (Edge
// Function `listar-executivos`) para o dropdown e o preenchimento
// automático do e-mail. Sem back end configurado (ou se a função
// falhar), usa o fallback fictício do config — nenhum dado real de
// pessoa fica no repositório (LGPD).
// ================================================================

import {
  executivos as fallbackLista,
  emailsExecutivos as fallbackEmails,
  URL_LISTAR_EXECUTIVOS,
  SUPABASE_ANON,
  TEM_BACKEND,
} from "../config/index.ts";

type Opcao = { valor: string; rotulo: string };

// Começam com o fallback fictício; o back end substitui ao carregar.
let lista: Opcao[] = fallbackLista;
let emails: Record<string, string> = fallbackEmails;
let carregado = false;

/** Busca os executivos do back end (uma vez só). Cai no fallback se falhar. */
export async function carregarExecutivos(): Promise<void> {
  if (carregado) return;

  if (TEM_BACKEND) {
    try {
      const resposta = await fetch(URL_LISTAR_EXECUTIVOS, {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      });
      if (resposta.ok) {
        const dados = (await resposta.json()) as {
          nome: string;
          email: string;
        }[];

        // Monta a lista e o mapa de e-mails a partir do back end.
        const novaLista: Opcao[] = [];
        const novosEmails: Record<string, string> = {};
        for (const item of dados) {
          if (!item.nome) continue;
          novaLista.push({ valor: item.nome, rotulo: item.nome });
          if (item.email) novosEmails[item.nome] = item.email;
        }

        // Só troca o fallback se veio gente de verdade.
        if (novaLista.length > 0) {
          lista = novaLista;
          emails = novosEmails;
        }
        carregado = true;
        return;
      }
    } catch (erro) {
      console.warn(
        "Back end de executivos indisponível; usando fallback.",
        erro,
      );
    }
  }

  // Sem back end (ou falha): mantém o fallback fictício.
  carregado = true;
}

/** Lista para o <select> da identificação (nome como valor e rótulo). */
export function listaExecutivos(): Opcao[] {
  return lista;
}

/** E-mail cadastrado do executivo (string vazia se não houver). */
export function emailDoExecutivo(nome: string): string {
  return emails[nome] ?? "";
}
