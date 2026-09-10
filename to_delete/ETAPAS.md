# As etapas, na ordem em que foram construídas

15 migrations, de 05/08/2026 a 01/09/2026. Cada arquivo é **uma mudança**, com
data no nome (`AAAAMMDDHHMMSS_nome.sql`), e **roda em ordem** — o banco final é
a soma de todas elas.

A regra que valia: **mudança nova = arquivo novo**. Migration já aplicada em
produção nunca era reescrita; se precisou corrigir, entrava uma nova corrigindo.

Todos os arquivos citados estão em [`backend-supabase/migrations/`](backend-supabase/migrations/).

---

## Etapa 1 — O núcleo (05/08)

**`20260805120000_schema_app.sql`**

Cria o schema `app` e as 8 tabelas base do modelo comercial: `executivos`,
`agencias`, `visitas`, `agencia_visita`, `estresse_agencia`, `despesas`,
`notas_fiscais`, `historico_agencia`.

Decisão que se paga depois: o RLS é **ligado já aqui**, antes de existir
qualquer política. Sem política = ninguém lê nada. O sistema nasce trancado e
vai abrindo — não o contrário.

## Etapa 2 — Quem vê o quê (05/08)

**`20260805130000_auth_rls.sql`**

A etapa mais densa do projeto. Traz três coisas:

1. **Grants** — o RLS filtra *linhas*, mas o grant é que libera a *tabela*.
   Precisa dos dois. Inclui o `service_role`, senão as Edge Functions levam
   "permission denied for schema app".
2. **Funções de apoio** — `executivo_atual()`, `perfil_atual()`, `ve_tudo()`,
   `agencia_visivel()`, `despesa_visivel()`. Todas `security definer` para
   evitar recursão.
3. **Gatilho `trg_link_executivo`** — quando alguém cria login, o e-mail é
   casado com o executivo já cadastrado e o `auth_id` é preenchido sozinho.

Depois disso, as políticas de todas as 8 tabelas.

> O comentário no arquivo já avisava que o Operacional (acesso por setor)
> ficaria para uma fase dedicada. Isso virou a etapa 7.

## Etapa 3 — A view da tela (06/08)

**`20260806100000_agencias_view.sql`**

`agencias` ganha endereço e perfil comercial como atributos **atuais** (o
histórico por visita continua em `agencia_visita`). Nasce a `vw_agencias`, que
entrega tudo já mastigado no formato da tela — inclusive derivados como total
de visitas e nível de estresse atual.

## Etapa 4 — Dados da planilha (06/08)

**`20260806140000_agencias_cnpj_comissao.sql`**

CNPJ e comissão, vindos da planilha do Infotravel. Mudança sutil e importante:
`executivos.email` deixa de ser obrigatório — promotores importados entram
**sem login**, e ganham acesso depois se precisarem.

## Etapa 5 — Ocorrências (07/08)

**`20260807100000_ocorrencias.sql`**

Três tabelas (`ocorrencias`, `ocorrencia_andamentos`, `ocorrencia_anexos`), o
helper `ocorrencia_visivel()` e o primeiro bucket de Storage
(`ocorrencia-anexos`, privado).

Detalhe que evita dor de cabeça: as políticas de Storage vivem no schema
`storage`, então um `drop schema app cascade` **não** as remove. Por isso cada
uma vem com `drop policy if exists` antes — assim o arquivo pode rodar de novo.

## Etapa 6 — O sino (07/08)

**`20260807110000_notificacoes.sql`**

`notificacoes` + o gatilho `trg_ocorrencia_notifica`: abriu ocorrência com
setor → notifica todo executivo ativo daquele setor.

A decisão de segurança: **não existe política de INSERT para o usuário**. Só o
gatilho grava. O cliente não escolhe destinatário — ele só pede "as minhas".

## Etapa 7 — Permissões e feature flags (07/08)

**`20260807120000_permissoes_liberacoes.sql`**

Três tabelas que tiram configuração do código:

- `permissoes` — o catálogo (7 permissões).
- `perfil_permissoes` — o mapa perfil → permissões.
- `liberacoes` — feature flags (`envio_email_relatorio`,
  `importacao_infotera`, `kanban_ocorrencias`).

Leitura liberada a todo logado — o app precisa saber o que pode. Edição só
para quem vê tudo.

## Etapas 8, 9 e 10 — Refino das ocorrências (08/08)

Três migrations no mesmo dia, cada uma resolvendo uma lacuna descoberta no uso:

| Arquivo | O que acrescenta |
|---|---|
| `…100000_ocorrencia_gravidade_repasse_reembolso` | gravidade 1–5, `responsavel_id`, gatilho de repasse. E tira `editar_status_despesa` do Executivo — reembolso passa a ser decisão da gestão. |
| `…110000_ocorrencia_datas` | `data_inicio` + gatilho que carimba início/fim conforme a situação muda |
| `…120000_ocorrencia_prazo` | `prazo`, e o responsável escolhido **na abertura** também passa a ser notificado |

A etapa 10 recria `on_ocorrencia_criada()` com um cuidado: se o responsável já
é do mesmo setor, não manda notificação duplicada.

## Etapa 11 — Trajetos (22/08)

**`20260822100000_trajetos.sql`**

Antes, deslocamento virava uma despesa "Quilometragem" — e perdia cidade de
partida, destino e KM. Ganha tabela própria: `trajetos`. Normalizado, sem
perder dado.

## Etapa 12 — CNPJ e comissão na tela (25/08)

**`20260825120000_vw_agencias_cnpj_comissao.sql`**

As colunas da etapa 4 finalmente entram na `vw_agencias`. Entram **no fim** —
é o que o `create or replace view` do Postgres permite sem recriar.

Nota de segurança registrada no arquivo: o grant continua só para
`authenticated`. O papel `anon` não tem acesso, então a chave pública do
formulário nunca lê CNPJ nem comissão.

## Etapa 13 — Foto e primeiro acesso (25/08)

**`20260825140000_admin_foto_login.sql`**

`executivos` ganha `foto_url` e `precisa_trocar_senha`. Nasce o bucket
`avatares` (privado — foto de gente interna não é pública). Nesta etapa, só
Admin/Gestor mexem em foto.

## Etapa 14 — Trocar a senha provisória (25/08)

**`20260825160000_marcar_senha_trocada.sql`**

Um problema real: o RLS só deixa Admin/Gestor darem update em `executivos` —
então um Executivo não conseguia limpar a **própria** marca de senha pendente.

A saída é o padrão que se repete no projeto: função `security definer` que
mexe **só na linha do próprio usuário** (`where auth_id = auth.uid()`) e **só
naquele campo**. Não serve para virar Administrador.

## Etapa 15 — Foto self-service (01/09)

**`20260901120000_foto_propria.sql`**

Última etapa. Libera cada usuário a gerenciar a **própria** foto, com duas
travas independentes:

1. **Storage** — só escreve na pasta cujo primeiro segmento é o `auth.uid()`
   dele.
2. **Banco** — `definir_minha_foto()` / `remover_minha_foto()`, de novo
   mexendo só na própria linha e só em `foto_url`.

As políticas de Admin/Gestor continuam valendo: políticas RLS são
permissivas, então somam-se via OR.

---

## Os outros dois arquivos SQL

| Arquivo | O que é |
|---|---|
| `setup_completo.sql` | Todas as migrations **juntas**, para montar um banco do zero de uma vez. Conveniência, **não** fonte da verdade. |
| `seed_dev.sql` | Dados de amostra para desenvolvimento. Não roda em produção. Contém um placeholder `SEU-EMAIL@AQUI.com` para o Administrador. |
