// ================================================================
// EDGE FUNCTION — enviar-email
// Roda no servidor (Deno, no Supabase). Recebe { para, assunto, html }
// e dispara o e-mail via Resend, usando a chave SECRETA que fica só aqui.
// Exige login (verify_jwt padrão do Supabase), então visitante não usa.
//
// Deploy:  supabase functions deploy enviar-email
// Segredos: supabase secrets set RESEND_API_KEY=...  (e EMAIL_REMETENTE opcional)
// ================================================================

// Cabeçalhos CORS pra o navegador (CRM) conseguir chamar a função.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const { para, assunto, html } = await req.json();
    if (!para || !assunto) {
      return resposta({ erro: "Informe 'para' e 'assunto'." }, 400);
    }

    const chave = Deno.env.get("RESEND_API_KEY");
    if (!chave) {
      return resposta({ erro: "RESEND_API_KEY não configurada." }, 500);
    }
    const remetente =
      Deno.env.get("EMAIL_REMETENTE") ?? "Cativa CRM <onboarding@resend.dev>";

    // Chama o Resend pra enviar de verdade
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remetente,
        to: [para],
        subject: assunto,
        html: html ?? "",
      }),
    });

    const dados = await r.json();
    if (!r.ok) {
      return resposta({ erro: dados }, r.status);
    }
    return resposta({ ok: true, id: dados.id });
  } catch (e) {
    return resposta({ erro: String(e) }, 500);
  }
});
