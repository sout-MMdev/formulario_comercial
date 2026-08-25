// ================================================================
// EDGE FUNCTION — admin-usuarios
// Ações de administração que exigem a service_role (só o servidor pode):
//   - criar        : cria o login (Auth) + o executivo, devolve a senha
//   - resetar-senha: gera nova senha provisória pra um executivo
//
// SEGURANÇA (duas camadas):
//   1) verify_jwt padrão do Supabase → só entra quem está logado.
//   2) AQUI DENTRO conferimos o PERFIL do chamador: só Administrador/Gestor
//      seguem. Um Executivo logado bate na porta e recebe 403.
// A senha real é gerada no servidor e devolvida UMA vez, pro admin repassar.
// O front nunca guarda a service_role.
//
// Deploy (exige login → NÃO usar --no-verify-jwt):
//   supabase functions deploy admin-usuarios
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente.)
// ================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

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

// Senha provisória legível: sem caracteres ambíguos (0/O, 1/l/I).
// Aleatoriedade forte (crypto), não Math.random.
function gerarSenha(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += chars[bytes[i] % chars.length];
  }
  return s;
}

// Valida e-mail sem regex (pedido do projeto): tem 1 arroba, com texto
// antes e um ponto depois, e nada de espaço.
function ehEmail(v: string): boolean {
  if (!v || v.includes(" ")) return false;
  const partes = v.split("@");
  if (partes.length !== 2) return false;
  const [antes, depois] = partes;
  if (antes.length === 0) return false;
  if (!depois.includes(".")) return false;
  // não pode terminar em ponto nem ter ponto logo após o arroba
  if (depois.startsWith(".") || depois.endsWith(".")) return false;
  return true;
}

const PERFIS_VALIDOS = ["Administrador", "Gestor", "Executivo", "Operacional"];

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

    // Cliente com service_role, apontando pro schema app (nossas tabelas).
    const admin = createClient(url, chaveServico, { db: { schema: "app" } });

    // ---- Camada 2: confere QUEM está chamando ----
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!jwt) return resposta({ erro: "Sem autenticação." }, 401);

    const { data: userData, error: erroUser } = await admin.auth.getUser(jwt);
    if (erroUser || !userData?.user) {
      return resposta({ erro: "Sessão inválida." }, 401);
    }

    // Perfil do chamador (pelo auth_id ligado ao executivo).
    const { data: eu } = await admin
      .from("executivos")
      .select("perfil")
      .eq("auth_id", userData.user.id)
      .maybeSingle();
    const perfilChamador = (eu as { perfil?: string } | null)?.perfil;
    if (perfilChamador !== "Administrador" && perfilChamador !== "Gestor") {
      return resposta({ erro: "Sem permissão para administrar usuários." }, 403);
    }

    // ---- Ação pedida ----
    const corpo = await req.json();
    const acao = corpo?.acao;

    // ========= CRIAR =========
    if (acao === "criar") {
      const nome = String(corpo.nome ?? "").trim();
      const email = String(corpo.email ?? "").trim().toLowerCase();
      const perfil = String(corpo.perfil ?? "Executivo").trim();
      const setor = corpo.setor ? String(corpo.setor).trim() : null;

      if (!nome) return resposta({ erro: "Informe o nome." }, 400);
      if (!ehEmail(email)) return resposta({ erro: "E-mail inválido." }, 400);
      if (!PERFIS_VALIDOS.includes(perfil)) {
        return resposta({ erro: "Perfil inválido." }, 400);
      }

      // Já existe um executivo com esse e-mail?
      const { data: jaTem } = await admin
        .from("executivos")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (jaTem) return resposta({ erro: "Já existe um usuário com esse e-mail." }, 409);

      // 1) Cria o login no Auth (e-mail já confirmado → entra direto).
      const senha = gerarSenha();
      const { data: novo, error: erroCriar } = await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });
      if (erroCriar || !novo?.user) {
        return resposta({ erro: erroCriar?.message ?? "Falha ao criar login." }, 400);
      }

      // 2) Cria o executivo já ligado ao login (auth_id).
      const { error: erroExec } = await admin.from("executivos").insert({
        nome,
        email,
        perfil,
        setor,
        ativo: true,
        auth_id: novo.user.id,
        precisa_trocar_senha: true,
      });
      if (erroExec) {
        // Rollback: desfaz o login pra não deixar órfão.
        await admin.auth.admin.deleteUser(novo.user.id);
        return resposta({ erro: erroExec.message }, 400);
      }

      return resposta({ ok: true, senha });
    }

    // ========= RESETAR SENHA =========
    if (acao === "resetar-senha") {
      const id = Number(corpo.id);
      if (!id) return resposta({ erro: "Informe o id do usuário." }, 400);

      const { data: ex } = await admin
        .from("executivos")
        .select("id, email, auth_id")
        .eq("id", id)
        .maybeSingle();
      const exec = ex as { id: number; email: string | null; auth_id: string | null } | null;
      if (!exec) return resposta({ erro: "Usuário não encontrado." }, 404);

      const senha = gerarSenha();

      if (exec.auth_id) {
        // Já tem login → só troca a senha.
        const { error } = await admin.auth.admin.updateUserById(exec.auth_id, {
          password: senha,
        });
        if (error) return resposta({ erro: error.message }, 400);
      } else {
        // Nunca teve login (ex.: promotor importado) → cria agora.
        if (!exec.email || !ehEmail(exec.email)) {
          return resposta({ erro: "Usuário sem e-mail válido para criar login." }, 400);
        }
        const { data: novo, error } = await admin.auth.admin.createUser({
          email: exec.email,
          password: senha,
          email_confirm: true,
        });
        if (error || !novo?.user) {
          return resposta({ erro: error?.message ?? "Falha ao criar login." }, 400);
        }
        // Liga o login ao executivo.
        await admin.from("executivos").update({ auth_id: novo.user.id }).eq("id", id);
      }

      await admin.from("executivos").update({ precisa_trocar_senha: true }).eq("id", id);
      return resposta({ ok: true, senha });
    }

    return resposta({ erro: "Ação desconhecida." }, 400);
  } catch (e) {
    return resposta({ erro: String(e) }, 500);
  }
});
