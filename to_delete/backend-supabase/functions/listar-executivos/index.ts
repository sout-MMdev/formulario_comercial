// ================================================================
// EDGE FUNCTION — listar-executivos
// Devolve os executivos que preenchem o formulário (nome + e-mail),
// para o dropdown e o preenchimento automático do e-mail. Roda com a
// service_role, então os dados reais ficam no back end — nunca no
// repositório/bundle público (LGPD).
//
// "Quem preenche o formulário" = executivo ATIVO, com e-mail cadastrado
// e que não seja o Administrador do CRM.
//
// Pública (formulário não tem login) — faça o deploy sem verificação de JWT:
//   supabase functions deploy listar-executivos --no-verify-jwt
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente da função.)
// ================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const chaveServico = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !chaveServico) {
      return resposta({ erro: "Back end não configurado." }, 500);
    }

    const supabase = createClient(url, chaveServico, {
      db: { schema: "app" },
    });

    const { data, error } = await supabase
      .from("executivos")
      .select("nome, email")
      .eq("ativo", true)
      .not("email", "is", null)
      .neq("perfil", "Administrador")
      .order("nome");

    if (error) {
      return resposta({ erro: error.message }, 500);
    }

    // Cacheia por 5 min (a lista muda muito pouco).
    return new Response(JSON.stringify(data ?? []), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return resposta({ erro: String(e) }, 500);
  }
});
