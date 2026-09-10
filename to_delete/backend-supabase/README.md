# Backend (Supabase) — como está organizado

Backend do CRM/formulário no Supabase (projeto **cativa-crm**). Tudo mora no
schema **`app`**. Este guia explica **onde fica cada coisa** e **como mexer sem
quebrar** — é o mapa pra não precisar lembrar de tudo depois.

```
backend/supabase/
├── migrations/        ← 1 arquivo por MUDANÇA (o histórico de verdade)
├── functions/         ← Edge Functions (Deno) — código que roda no servidor
├── setup_completo.sql ← TUDO junto, pra montar um banco do zero de uma vez
└── seed_dev.sql       ← dados de exemplo pra desenvolvimento
```

## `migrations/` — uma mudança por arquivo

Cada arquivo é **uma mudança**, com data no nome
(`AAAAMMDDHHMMSS_nome.sql`) e **roda em ordem**. Esse é o **histórico real** do
banco: o banco atual = a soma de todas as migrations aplicadas na ordem.

**Regra de ouro:** mudança nova = **arquivo novo**. Nunca reescreva uma
migration já aplicada em produção (isso bagunça o histórico e pode dar erro ao
re-rodar). Se precisou corrigir algo, cria uma migration nova que corrige.

### Como organizar cada arquivo — por FUNCIONALIDADE, não por categoria

Não separe "todas as tabelas num arquivo, todas as políticas em outro". O
melhor é **cada arquivo = uma funcionalidade**, e **dentro dele** as seções
juntas, nesta ordem:

```sql
-- 1) ESTRUTURA      → create table / alter table
-- 2) SEGURANÇA (RLS) → enable row level security + policies (colada na tabela)
-- 3) ACESSOS        → grants (quem pode SELECT/INSERT/…)
-- 4) REGRA DE NEGÓCIO → funções / triggers, se houver
```

Por que assim: quando você mexe numa funcionalidade, mexe **num arquivo só**, e
a **segurança (RLS) fica do lado da tabela que ela protege** — bem mais difícil
esquecer de trancar uma tabela.

### O que já existe (em ordem)

| Migration | O que faz |
|---|---|
| `…_schema_app` | Cria o schema `app` e as tabelas base |
| `…_auth_rls` | Auth + **RLS por perfil** (funções `ve_tudo`, `executivo_atual`…) + grants |
| `…_agencias_view` | View `vw_agencias` (agência no formato da tela) |
| `…_agencias_cnpj_comissao` | Campos CNPJ/comissão da planilha Infotera |
| `…_ocorrencias` | Ocorrências (tabelas + RLS + bucket de anexos) |
| `…_notificacoes` | Notificações |
| `…_permissoes_liberacoes` | Permissões por perfil + liberações (feature flags) |
| `…_ocorrencia_*` | Ajustes de ocorrência (gravidade/repasse/datas/prazo) |
| `…_trajetos` | Trajetos de KM (reembolso) |
| `…_vw_agencias_cnpj_comissao` | CNPJ/comissão entram na view |
| `…_admin_foto_login` | Foto do colaborador (bucket `avatares`) + `precisa_trocar_senha` |
| `…_marcar_senha_trocada` | Função da troca de senha no 1º acesso |

## `setup_completo.sql` — só pra começar do zero

É **todas as migrations juntas** num arquivo, pra montar um banco novo de uma
vez. **Não é a fonte da verdade** — é conveniência. Ao criar uma migration
nova, o certo é ela ser o que você cola no dia; o `setup_completo` você só
atualiza pra manter o "montar do zero" funcionando.

## Como aplicar (o fluxo de hoje)

O MCP/CLI não está ligado neste projeto, então o SQL é colado **à mão**:

1. Abre o **SQL Editor** do projeto `cativa-crm`.
2. Cola o conteúdo da migration nova → **Run**.

> Futuro: se conectar o **Supabase CLI** (`supabase link`), dá pra rodar
> `supabase db push` e ele aplica as migrations **em ordem, sozinho** — some o
> trabalho manual. Aí `migrations/` deixa de ser só histórico e vira o que
> realmente aplica.

## `functions/` — Edge Functions (Deno, não Node)

Código que roda **no servidor** do Supabase, em **Deno** (não Node): usa
`Deno.serve`, `Deno.env.get` e imports por URL (`jsr:@supabase/supabase-js@2`).
É onde vivem os segredos (a `service_role`, a chave do Resend) — **nunca** no
front.

> Os "erros" que o VS Code mostra nesses arquivos são **falso positivo** (o
> editor usa o TypeScript do Node e não entende Deno). No servidor roda liso.

| Função | Pública? | Deploy |
|---|---|---|
| `listar-agencias` | Sim (formulário sem login) | `supabase functions deploy listar-agencias --no-verify-jwt` |
| `listar-executivos` | Sim (formulário) | `… deploy listar-executivos --no-verify-jwt` |
| `receber-formulario` | Sim (formulário) | `… deploy receber-formulario --no-verify-jwt` |
| `enviar-email` | Não (exige login) | `supabase functions deploy enviar-email` |
| `admin-usuarios` | Não (exige login + Admin/Gestor) | `supabase functions deploy admin-usuarios` |

Regra: função **pública** (visitante sem login usa) vai com `--no-verify-jwt`.
Função do **CRM** (exige estar logado) vai **sem** a flag — o "Verify JWT" fica
ligado, e o `admin-usuarios` ainda confere por dentro se é Admin/Gestor.

## Segredos das funções (não vão pro git)

Ficam no Supabase (`Edge Functions → Secrets`), nunca no código:

- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` — **injetados automaticamente**.
- `RESEND_API_KEY` (e `EMAIL_REMETENTE`) — pro `enviar-email`.
