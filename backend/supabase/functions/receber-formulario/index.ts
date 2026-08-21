// ================================================================
// EDGE FUNCTION — receber-formulario
// Recebe um relatório do dia (DiaSalvo) do formulário e:
//   1) grava tudo no CRM (schema app: visitas, agencia_visita,
//      estresse_agencia, historico_agencia, despesas);
//   2) dispara a cópia por e-mail para o executivo (Resend).
//
// Roda com a service_role (grava mesmo sem login). Só a função escreve
// — o cliente nunca fala direto com o banco.
//
// Pública (formulário não tem login) — deploy sem verificação de JWT:
//   supabase functions deploy receber-formulario --no-verify-jwt
// Segredos usados (já configurados p/ o enviar-email): RESEND_API_KEY,
// EMAIL_REMETENTE (opcional).
// ================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

/** Data de hoje em "YYYY-MM-DD" (fallback quando o campo vem vazio). */
function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Resolução de executivo/agência (cria se não existir, pelo nome) ──

async function obterOuCriarExecutivo(
  db: any,
  nome: string,
  email: string,
): Promise<number | null> {
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return null;

  const { data: achado } = await db
    .from("executivos")
    .select("id, email")
    .eq("nome", nomeLimpo)
    .maybeSingle();

  if (achado) {
    // Preenche o e-mail se estiver faltando no cadastro.
    if (email && !achado.email) {
      await db.from("executivos").update({ email }).eq("id", achado.id);
    }
    return achado.id;
  }

  const { data: novo, error } = await db
    .from("executivos")
    .insert({ nome: nomeLimpo, email: email || null, perfil: "Executivo" })
    .select("id")
    .single();
  if (error) throw new Error("executivo: " + error.message);
  return novo.id;
}

/** Retorna "YYYY-MM-DD" se for uma data válida; senão null (sem regex). */
function ehData(v: unknown): string | null {
  if (typeof v !== "string" || v.length !== 10) return null;
  if (v[4] !== "-" || v[7] !== "-") return null;
  return v;
}

/**
 * Acha a agência pelo nome (ignora maiúsc./minúsc.) e ATUALIZA o perfil
 * comercial dela com o que veio do formulário — assim a ficha do CRM
 * preenche sozinha. Se não existir, cria (status Prospecção + responsável
 * atual). NUNCA mexe no status nem no responsável de uma agência que já existe.
 */
async function resolverAgencia(
  db: any,
  ag: any,
  executivoId: number,
): Promise<number | null> {
  const nome = (ag?.nome ?? "").trim();
  if (!nome) return null;

  const endereco = ag?.endereco ?? {};
  const logradouro =
    [endereco?.logradouro, endereco?.numero, endereco?.complemento]
      .filter(Boolean)
      .join(", ") || null;

  // Perfil comercial vindo do formulário (o que a ficha do CRM mostra).
  const perfil: Record<string, unknown> = {
    logradouro,
    bairro: endereco?.bairro || null,
    cidade: endereco?.cidade || null,
    cep: endereco?.cep || null,
    uf: endereco?.uf || null,
    faturamento_anual: ag?.faturamentoAnual || null,
    produtos: ag?.produtos ?? [],
    atendentes: ag?.atendentes ?? [],
    data_fundacao: ehData(ag?.dataFundacao),
  };

  // Procura a agência existente (case-insensitive).
  const { data } = await db
    .from("agencias")
    .select("id")
    .ilike("nome", nome)
    .limit(1);
  const achado = (data ?? [])[0];

  if (achado) {
    // Atualiza SÓ o perfil — mantém status e responsável atuais.
    await db.from("agencias").update(perfil).eq("id", achado.id);
    return achado.id;
  }

  // Agência nova de verdade: perfil + status inicial + responsável atual.
  const { data: nova, error } = await db
    .from("agencias")
    .insert({
      nome,
      status: "Prospecção",
      executivo_id: executivoId,
      ...perfil,
    })
    .select("id")
    .single();
  if (error) throw new Error("agencia: " + error.message);
  return nova.id;
}

// ── Gravações por fluxo ──────────────────────────────────────────

async function gravarVisita(db: any, dia: any, executivoId: number): Promise<void> {
  const dataVisita: string = dia?.visita?.data || hoje();

  // 1 visita (o "cabeçalho" do dia em campo)
  const { data: visita, error: erroVisita } = await db
    .from("visitas")
    .insert({ executivo_id: executivoId, data_visita: dataVisita })
    .select("id")
    .single();
  if (erroVisita) throw new Error("visita: " + erroVisita.message);
  const visitaId = visita.id;

  const agencias: any[] = dia?.agenciasComercial ?? [];
  for (const ag of agencias) {
    const nome = (ag?.nome ?? "").trim();
    if (!nome) continue;
    const agenciaId = await resolverAgencia(db, ag, executivoId);
    if (!agenciaId) continue;

    // O que foi tratado nesta agência, nesta visita.
    await db.from("agencia_visita").insert({
      visita_id: visitaId,
      agencia_id: agenciaId,
      faturamento_anual: ag?.faturamentoAnual || null,
      produtos: ag?.produtos ?? [],
      atendentes: ag?.atendentes ?? [],
      acoes: ag?.acoes ?? [],
    });

    // Termômetro (um registro por nível informado).
    const estresses: any[] = ag?.estresses ?? [];
    for (const es of estresses) {
      if (!es?.nivel) continue;
      await db.from("estresse_agencia").insert({
        agencia_id: agenciaId,
        executivo_id: executivoId,
        visita_id: visitaId,
        nivel: es.nivel,
        setores: es?.setores ?? [],
        descricao: es?.descricao || null,
        data_registro: dataVisita,
      });
    }

    // Linha do tempo da agência (feed do CRM).
    await db.from("historico_agencia").insert({
      agencia_id: agenciaId,
      executivo_id: executivoId,
      tipo_evento: "Visita",
      descricao: "Visita registrada pelo formulário comercial.",
      origem: "sistema",
      data_evento: dataVisita,
    });
  }
}

async function gravarDespesas(db: any, dia: any, executivoId: number): Promise<void> {
  const linhas: any[] = [];

  // Trajetos (KM) entram como despesa de "Quilometragem".
  const trajetos: any[] = dia?.trajetos ?? [];
  for (const t of trajetos) {
    const km = Number(t?.km) || 0;
    if (km <= 0) continue;
    linhas.push({
      executivo_id: executivoId,
      data: t?.data || dia?.visita?.data || hoje(),
      cartao: null,
      categoria: "Quilometragem",
      valor: Number(t?.reembolsoKm) || 0,
      status: "Pendente",
    });
  }

  // Despesas de cartão.
  const despesas: any[] = dia?.despesas ?? [];
  for (const d of despesas) {
    if (!d?.cartao && !d?.categoria) continue;
    linhas.push({
      executivo_id: executivoId,
      data: d?.data || hoje(),
      cartao: d?.cartao || null,
      categoria: d?.categoria || null,
      valor: Number(d?.valor) || 0,
      status: "Pendente",
    });
  }

  if (linhas.length > 0) {
    const { error } = await db.from("despesas").insert(linhas);
    if (error) throw new Error("despesas: " + error.message);
  }
}

// ── Cópia por e-mail (Resend) ────────────────────────────────────

function montarHtml(dia: any): string {
  const nome = dia?.identificacao?.nome ?? "";
  const dataVisita = dia?.visita?.data ?? "";
  const agencias: any[] = dia?.agenciasComercial ?? [];
  const despesas: any[] = dia?.despesas ?? [];
  const trajetos: any[] = dia?.trajetos ?? [];

  // Lista simples de agências (sem regex; só join).
  const listaAgencias = agencias
    .map((a) => a?.nome)
    .filter(Boolean)
    .join(", ");

  return [
    "<h2>Relatório comercial</h2>",
    "<p><strong>Executivo:</strong> " + nome + "</p>",
    dataVisita ? "<p><strong>Data da visita:</strong> " + dataVisita + "</p>" : "",
    listaAgencias ? "<p><strong>Agências:</strong> " + listaAgencias + "</p>" : "",
    "<p><strong>Trajetos:</strong> " + trajetos.length + " | <strong>Despesas:</strong> " + despesas.length + "</p>",
    "<hr><p style='color:#888;font-size:12px'>Cópia automática do formulário — as informações foram registradas no CRM.</p>",
  ].join("");
}

async function enviarCopia(email: string, dia: any): Promise<boolean> {
  const chave = Deno.env.get("RESEND_API_KEY");
  if (!chave) return false; // sem Resend configurado, apenas não envia
  const remetente =
    Deno.env.get("EMAIL_REMETENTE") ?? "Relatório <onboarding@resend.dev>";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remetente,
      to: [email],
      subject: "Sua cópia do relatório comercial",
      html: montarHtml(dia),
    }),
  });
  return r.ok;
}

// ── Handler ──────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return resposta({ erro: "Use POST." }, 405);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const chaveServico = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !chaveServico) {
      return resposta({ erro: "Back end não configurado." }, 500);
    }
    const db = createClient(url, chaveServico, { db: { schema: "app" } });

    const dia = await req.json();
    const email: string = (dia?.identificacao?.email ?? "").trim();
    const fluxos: string[] = dia?.fluxos ?? [];

    // Resolve (ou cria) o executivo que assinou o relatório.
    const executivoId = await obterOuCriarExecutivo(
      db,
      dia?.identificacao?.nome ?? "",
      email,
    );
    if (!executivoId) {
      return resposta({ erro: "Informe o nome do executivo." }, 400);
    }

    if (fluxos.includes("visita")) {
      await gravarVisita(db, dia, executivoId);
    }
    if (fluxos.includes("despesas")) {
      await gravarDespesas(db, dia, executivoId);
    }

    // Cópia por e-mail (não derruba o envio se o e-mail falhar).
    let emailEnviado = false;
    if (email) {
      try {
        emailEnviado = await enviarCopia(email, dia);
      } catch (_e) {
        emailEnviado = false;
      }
    }

    return resposta({
      enviadoAoCrm: true,
      emailEnviado,
      emailDestino: email,
    });
  } catch (e) {
    return resposta(
      {
        enviadoAoCrm: false,
        emailEnviado: false,
        emailDestino: "",
        erro: String(e),
      },
      500,
    );
  }
});
