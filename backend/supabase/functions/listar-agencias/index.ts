// ================================================================
// EDGE FUNCTION — listar-agencias
// Devolve os NOMES das agências (app.agencias) para o autocomplete do
// formulário. Roda no servidor com a service_role, então a base real
// fica no back end — nunca no repositório/bundle público (LGPD).
// Expõe SÓ nomes (nenhum CNPJ/endereço/dado sensível).
//
// Pública (formulário não tem login) — faça o deploy sem verificação de JWT:
//   supabase functions deploy listar-agencias --no-verify-jwt
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente da função.)
// ================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

// Cabeçalhos CORS pro navegador (formulário) conseguir chamar a função.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function resposta(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Pré-voo do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const chaveServico = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !chaveServico) {
      return resposta({ erro: "Back end não configurado." }, 500);
    }

    // Cliente com a service_role (bypassa o RLS) apontando pro schema `app`.
    const supabase = createClient(url, chaveServico, {
      db: { schema: "app" },
    });

    // O PostgREST devolve no máximo ~1000 linhas por vez, então puxamos
    // em páginas até acabar (a base tem ~17 mil agências).
    const nomes: string[] = [];
    const TAMANHO_PAGINA = 1000;
    let inicio = 0;

    while (true) {
      const { data, error } = await supabase
        .from("agencias")
        .select("nome")
        .order("nome")
        .range(inicio, inicio + TAMANHO_PAGINA - 1);

      if (error) {
        return resposta({ erro: error.message }, 500);
      }

      const pagina = (data ?? []) as { nome: string }[];
      for (const linha of pagina) {
        if (linha.nome) nomes.push(linha.nome);
      }

      // Última página: veio menos que o tamanho cheio → acabou.
      if (pagina.length < TAMANHO_PAGINA) break;
      inicio += TAMANHO_PAGINA;
    }

    // Cacheia no CDN por 1h (a base muda pouco).
    return new Response(JSON.stringify(nomes), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return resposta({ erro: String(e) }, 500);
  }
});
