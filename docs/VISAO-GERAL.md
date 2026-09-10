# Visão Geral — Sistema Cativa Operadora

Documentação de alto nível dos três projetos e de como eles se conversam.
Para o detalhe de cada parte, veja [FORMULARIO.md](FORMULARIO.md) e, no
repositório do CRM, `docs/CRM.md`.

> ⚠️ Este documento cita o CRM (privado/Cativa). Se o repositório do
> formulário for aberto como portfólio, remova/mova esta pasta antes.

---

## 1. O que é

Dois front-ends que dividem **um único back end**:

| Projeto | O que faz | Quem usa |
|---|---|---|
| **Formulário** (desktop + mobile) | Registro em campo: visita à agência, nível de estresse, despesas e trajetos (KM) | Executivos de conta, no dia a dia |
| **CRM** (`crm_cativa_comercial`) | Gestão: agências, visitas, despesas/reembolso, ocorrências, relatórios, administração | Time comercial + gestão |
| **Back end** (Supabase) | Banco + Auth + RLS + Storage + Edge Functions | — (serve os dois fronts) |

O formulário **alimenta** o CRM: o que o executivo registra em campo vira
dado no banco, e o CRM lê/gerencia.

---

## 2. Arquitetura

```
   FORMULÁRIO (desktop/mobile)                 CRM (crm_cativa_comercial)
   sem login, chave anon               login + RLS por perfil
        │                                        │
        │  Edge Functions públicas               │  supabase-js (chave anon)
        │  (listar-agencias,                      │  + Edge Functions com login
        │   listar-executivos,                    │  (enviar-email, admin-usuarios)
        │   receber-formulario)                   │
        ▼                                        ▼
   ┌──────────────────────────────────────────────────────┐
   │                   SUPABASE (schema app)               │
   │  Postgres + RLS · Auth · Storage · Edge Functions     │
   └──────────────────────────────────────────────────────┘
```

- O **formulário** não tem login. Ele fala com o banco só por **Edge Functions
  públicas** (a chave de serviço fica no servidor). Assim o repositório pode ir
  público sem vazar dado real.
- O **CRM** tem login. Usa a **chave anon** no navegador (pública por design) e
  o **RLS** decide o que cada perfil vê. Ações privilegiadas (criar usuário,
  enviar e-mail) passam por **Edge Functions** que exigem login.

---

## 3. Stack

- **Front:** React 19 + TypeScript + Vite. Roteamento (CRM) com React Router.
- **Back:** Supabase — Postgres (schema `app`), Auth, RLS, Storage, Edge
  Functions em **Deno** (não Node).
- **E-mail:** Resend (via Edge Function).
- **Deploy:** Vercel — formulário = 2 projetos (desktop e mobile); CRM = 1 projeto.
- **i18n (CRM):** pt/en/es, um arquivo de textos por tela.

---

## 4. Segurança (regra de ouro)

- Tudo que vai pro navegador é **público**. Segredo (service_role, chave do
  Resend) mora **só em Edge Functions** (`supabase secrets`).
- A **chave anon** é pública de propósito — quem protege o dado é o **RLS** no
  servidor, não o front.
- O formulário só alcança **nomes** de agências/executivos (via Edge Function),
  nunca a tabela inteira. Sem dado real no bundle → **LGPD** ok.
- Cada Edge Function do CRM confere permissão por dentro (ex.: `admin-usuarios`
  exige Administrador/Gestor).

---

## 5. Onde está cada coisa

```
formulario_comercial/            (repositório do monorepo + backend)
├── apps/desktop/                formulário desktop
├── apps/mobile/                 formulário mobile
├── packages/nucleo/             regras + serviços compartilhados (desktop↔mobile)
├── backend/                     aguardando o novo acesso Supabase (ver backend/README.md)
├── backend/importacao/          scripts de importação de agências (Infotera)
├── docs/                        esta documentação
└── crm_cativa_comercial/        o CRM (repositório PRÓPRIO, ignorado pela raiz)
```

O `crm_cativa_comercial` é um **repositório git separado** (privado) dentro da pasta.

---

## 6. Estado atual

| Área | Situação |
|---|---|
| Formulário (desktop + mobile) | ✅ Ligado ao back end (fallback fictício por LGPD) |
| CRM — Agências, Ficha, Despesas, Visitas, Meu Painel | ✅ Real (Supabase + RLS) |
| CRM — Admin (Usuários, Perfis, Liberações) | ✅ Real (inclui criar login/senha via Edge Function) |
| CRM — Notificações, Ocorrências, Histórico, Estresse | ✅ Real |
| CRM — Foto do usuário (própria + admin) + 1º acesso | ✅ Real |
| **CRM — Relatórios** (aba + "Meus Relatórios") | 🔴 **Ainda mock** — ver pendências |

**Saúde do código (03/09/2026):** testes do núcleo 49/49, lint limpo, builds
dos 3 projetos OK.

---

## 7. Pendências conhecidas

1. **Relatórios do CRM** — único mock restante. Os blocos leem de dados
   fictícios mesmo com o back end ligado; `gerar/baixar/enviar` são simulados.
   De-mock envolve: consultas de agregação por executivo/período, geração de
   PDF de verdade e envio por e-mail.
2. **Domínio no Resend** — verificar o DNS do domínio pra e-mails reais saírem
   pros destinatários (hoje modo teste entrega só pro dono da conta Resend).
3. **Formulário público** — se abrir como portfólio: limpar histórico do git e
   remover qualquer referência à marca/d'ados Cativa (inclui esta pasta `docs/`).

---

## 8. Como rodar (resumo)

- **Formulário:** cada app é um projeto Vite. `npm install` na raiz (workspaces)
  e `npm run dev` dentro de `apps/desktop` ou `apps/mobile`.
- **CRM:** `npm install` + `npm run dev` dentro de `crm_cativa_comercial`. Precisa de
  `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- **Back end:** 🔴 **em transição.** O Supabase antigo foi retirado em
  10/09/2026 e o novo acesso ainda não chegou. A arquitetura anterior está
  documentada em `to_delete/ARQUITETURA.md`.
