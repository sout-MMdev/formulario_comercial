// ================================================================
// SERVIDOR — a parte que depende do Deno e do Supabase
// Aqui as interfaces puras ganham implementação real:
//   * cliente do banco com a chave de serviço (ignora RLS, só no servidor);
//   * chaves públicas aceitas, lidas do ambiente;
//   * e-mail pelo Mailpit.
// Tudo o que tem regra (validar, montar, processar) fica nos arquivos
// puros e testados no Node; este arquivo só "liga os fios".
// ================================================================

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { criarEnviadorMailpit } from "./email.ts";
import { lerListaDeChaves } from "./http.ts";
import type { Dependencias } from "./processar.ts";

/** Mailpit do Supabase local, visto de dentro do container das funções. */
const MAILPIT_PADRAO = "http://supabase_inbucket_formulario-comercial:8025";

/** Chaves que o navegador pode usar: publishable (novas) e anon (legada). */
export function chavesPublicasAceitas(): string[] {
  return [
    ...lerListaDeChaves(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")),
    ...lerListaDeChaves(Deno.env.get("SUPABASE_ANON_KEY")),
  ];
}

function chaveDeServico(): string {
  const [chave] = [
    ...lerListaDeChaves(Deno.env.get("SUPABASE_SECRET_KEYS")),
    ...lerListaDeChaves(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
  ];
  if (!chave) throw new Error("Chave de serviço ausente no ambiente da função.");
  return chave;
}

let cliente: SupabaseClient | null = null;

/** Cliente do banco com a chave de serviço (criado uma vez por instância). */
export function criarClienteServico(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("SUPABASE_URL ausente no ambiente da função.");
  cliente ??= createClient(url, chaveDeServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

export function urlMailpit(): string {
  return Deno.env.get("MAILPIT_URL") ?? MAILPIT_PADRAO;
}

/** As dependências de processarRelatorio, ligadas ao Supabase e ao Mailpit. */
export function dependenciasReais(): Dependencias {
  const banco = criarClienteServico();

  return {
    async buscarExecutivo(nome) {
      const { data, error } = await banco
        .from("executivos")
        .select("id, nome, email, tarifa_km")
        .eq("nome", nome)
        .eq("ativo", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { id: data.id, nome: data.nome, email: data.email, tarifaKm: Number(data.tarifa_km) };
    },

    async gravarRelatorio(relatorio) {
      const { data, error } = await banco
        .rpc("registrar_relatorio", { payload: relatorio })
        .single<{ relatorio_id: number; novo: boolean; email_ja_enviado: boolean }>();
      if (error) throw error;
      return {
        relatorioId: data.relatorio_id,
        novo: data.novo,
        emailJaEnviado: data.email_ja_enviado,
      };
    },

    enviador: criarEnviadorMailpit(urlMailpit()),

    async registrarEmail(registro) {
      const { error } = await banco.from("emails_enviados").insert({
        relatorio_id: registro.relatorioId,
        destino: registro.destino,
        assunto: registro.assunto,
        situacao: registro.situacao,
        detalhe_erro: registro.detalheErro,
      });
      // O relatório já está salvo: uma falha só na auditoria do e-mail
      // vai para o log, sem transformar o envio inteiro em erro.
      if (error) console.error("Falha ao registrar o e-mail enviado:", error);
    },
  };
}
