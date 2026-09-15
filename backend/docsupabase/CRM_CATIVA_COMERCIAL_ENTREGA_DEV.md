# CRM_CATIVA_COMERCIAL — ambiente Supabase: credenciais, decisões e base de agências

> Entrega ao desenvolvedor (11/09/2026). O projeto foi **criado e está no ar, vazio**, pronto
> para receber a primeira migration. A senha do banco e a chave secreta vêm por canal separado.
>
> **Este documento responde as 4 decisões que estavam com a Cativa** (§5) e traz duas coisas
> que mudam seu planejamento: **a base de agências passa a vir do ambiente de dados da Cativa**
> (§6), no lugar da planilha do Infotera; e o **fluxo de publicação das Edge Functions** (§2.1),
> que é o único ponto do trabalho que passa por nós — migrations e dados seguem 100% com você.

---

## 1. O projeto

| Item | Valor |
|---|---|
| Nome / ref | **CRM_CATIVA_COMERCIAL** / `bqblvpufzfupcsyvpqpg` |
| URL do projeto (API) | `https://bqblvpufzfupcsyvpqpg.supabase.co` |
| Região | `sa-east-1` (São Paulo — LGPD e latência) |
| Postgres | 17 |
| Plano | Pro (8 GB de disco, backup diário com retenção de 7 dias) |
| Organização | Cativa BI (administração da Cativa) |

## 2. Credenciais

| Credencial | Valor | Uso |
|---|---|---|
| **Conexão ao banco** (Session pooler) | `postgresql://postgres.bqblvpufzfupcsyvpqpg:[SENHA]@[HOST_POOLER]:5432/postgres` — string completa e senha por canal separado | migrations (`supabase link`/`db push`), DDL, administração |
| **Chave publishable** | `sb_publishable_bVvMZpcsH13mt_xF9cLfHw_dWXMgVJV` | front dos 3 apps (pública por design — quem protege o dado é o RLS) |
| **Chave secreta** (`sb_secret_…`) | **não entregue por padrão** — ver §2.2 | ignora RLS; só se houver uso fora do runtime das funções |

> **Conexão: use o Session pooler, não a "Direct connection".** A direta é IPv6-only e falha na
> maioria das redes. Host `aws-N-sa-east-1.pooler.supabase.com`, porta 5432, usuário
> `postgres.bqblvpufzfupcsyvpqpg`. O `N` exato vem na string enviada com a senha.

> Nas Edge Functions, **não configure** `SUPABASE_URL` nem `SUPABASE_SERVICE_ROLE_KEY` — o
> Supabase injeta as duas automaticamente (ponto levantado por você em §A2; confirmado).

## 2.1 Como você trabalha no dia a dia (autonomia e o único ponto de passagem)

As credenciais entregues são **escopadas a este projeto** — elas não alcançam nenhum outro
ambiente da Cativa, e por isso o `supabase login` (que autentica a *conta* inteira, com acesso
a todos os projetos da organização) não faz parte do pacote. Isso define o seu dia a dia assim:

| Tarefa | Você faz sozinho? |
|---|---|
| Criar e alterar tabelas, índices, RLS, funções, triggers (**migrations**) | ✅ **sim, direto** |
| Inserir, consultar e corrigir dados | ✅ sim |
| Rodar o stack local (`supabase start`, `functions serve`) e testar tudo offline | ✅ sim |
| Publicar o front dos 3 apps (VPS) | ✅ sim |
| **Publicar Edge Functions no projeto da nuvem** | ⚠️ **passa pela Cativa** — procedimento abaixo |
| Criar buckets, habilitar extensão, mudar config de Auth, ver logs do projeto | ⚠️ pedir à Cativa (resolvemos na hora) |

### Migrations: totalmente com você

O CLI aplica migrations apontando direto para o banco, sem precisar de login de conta:

```bash
supabase db push --db-url "postgresql://postgres.bqblvpufzfupcsyvpqpg:<SENHA>@<HOST_POOLER>:5432/postgres"
```

Ou seja, **toda a evolução do schema é autônoma** — que é a maior parte do trabalho.

### Edge Functions: o único ponto de passagem

O `functions deploy` é a única operação que exige autenticação de conta. O fluxo combinado:

1. **Você desenvolve e testa localmente** — `supabase functions serve` roda o runtime real na
   sua máquina; nada aqui depende da nuvem.
2. **Faz `push` para `Cativa-Operadora/CRM_CATIVA_COMERCIAL`** (você tem permissão de escrita).
   Estrutura padrão: `supabase/functions/<nome-da-funcao>/index.ts` + `deno.json` e
   dependências relativas, se houver.
3. **Avisa a Cativa** informando: **quais funções** publicar, **o commit** e, para cada uma, se
   ela **exige login** (`verify_jwt`) — pela decisão de §5.1, a resposta padrão é *sim*.
4. **A Cativa publica** lendo o código direto do repositório, pela API de gestão. Leva minutos.

**Por que assim, e por quanto tempo:** o motivo não é burocracia — é que dar acesso de painel
exigiria incluir você na organização, e um papel de organização vale para **todos os projetos**
dela (restringir a um projeto só existe em plano corporativo). Como as Edge Functions mudam
pouco depois de prontas, começamos assim e **vamos medir o atrito nas primeiras semanas**. Se
isso atrapalhar o desenvolvimento, avise — a alternativa já mapeada é mover este projeto para
uma organização própria, onde você teria painel completo sem alcançar os dados da Cativa (a
transferência preserva `ref`, URLs e chaves, então nada quebraria no app).

**Vantagem colateral:** como o `verify_jwt` é definido na publicação, a decisão de segurança de
§5.1 (nenhuma função pública de escrita) fica garantida por construção — não depende de alguém
lembrar da flag na linha de comando, que foi justamente como o problema antigo nasceu.

*(Automatizar via GitHub Actions é possível, mas exigiria guardar no repositório um token com
acesso à conta Supabase inteira — não compensa enquanto o volume de deploys for baixo.)*

## 2.2 Você provavelmente NÃO precisa da chave secreta

Como você mesmo observou, as Edge Functions recebem `SUPABASE_URL` e a credencial de serviço
**injetadas automaticamente** pelo Supabase em tempo de execução. E os três fronts usam apenas a
chave publishable. Ou seja, no desenho atual **não há lugar legítimo para a `sb_secret_` fora do
próprio runtime das funções**.

Por isso ela **não vai no pacote inicial**. Se aparecer necessidade real (um script local de
carga, uma rotina administrativa fora do Supabase), peça — entregamos na hora, pelo canal
seguro. É a aplicação do menor privilégio: credencial que ignora RLS só existe onde é
indispensável.

## 3. Estado do ambiente e o que já está decidido

| Item | Estado |
|---|---|
| Schema | **vazio** — nasce da sua primeira migration, via CLI (`supabase link` + `db push`) |
| Objetos do app | em schema próprio `app` (não em `public`) |
| Extensão `pg_trgm` | **aprovada** — habilite na migration inicial |
| Realtime | manter **desligado** |
| Buckets | criar `avatares` (2 MB; jpeg/png/webp) e `ocorrencia-anexos` (10 MB; imagens + PDF), com a lista de MIME fechada |
| Auth | sem cadastro público; `site_url` apontando para a URL de produção do CRM |
| Backup | diário automático (7 dias) + *dump* lógico periódico guardado fora do Supabase, pela Cativa |

## 4. Regras da casa (condições da entrega)

1. **RLS habilitada em toda tabela desde a criação**, no padrão *deny-all* antes das policies.
2. **A chave secreta nunca sai do servidor** — jamais em bundle de front, repositório ou log.
3. **As credenciais valem apenas para este projeto.** Sem acesso ao painel da organização; o que
   exigir administração (extensão nova, restore, config de Auth) é solicitado à Cativa.
4. **Migrations versionadas** em `Cativa-Operadora/CRM_CATIVA_COMERCIAL`, aplicadas pelo CLI.
   Sem DDL manual no SQL Editor.
5. **LGPD**: coleta mínima, finalidade do CRM, sem cópias fora do ambiente combinado.

## 5. As 4 decisões — RESPONDIDAS pela Cativa

### 5.1 ✅ O formulário passará a exigir LOGIN

Decisão: **sim**. É a recomendação que você mesmo fez, e resolve os dois achados de segurança de
uma vez: `receber-formulario` deixa de ser público e passa a rodar com o usuário autenticado
(sem `service_role`, com RLS valendo), e `listar-agencias`/`listar-executivos` saem do ar como
funções públicas — encerrando também a exposição de e-mails corporativos.

Consequências que pedimos que entrem no desenho da primeira migration:

- as três Edge Functions passam a ser deployadas **sem** `--no-verify-jwt`;
- **remover o comportamento `obterOuCriarExecutivo` / `obterOuCriarAgencia`**: nenhuma entidade
  deve nascer de uma requisição de formulário. Agência que não existe na base deve ser
  **rejeitada** (ver §6 — a base agora é sincronizada da Cativa);
- o RLS do formulário segue o mesmo princípio do CRM: o executivo grava o que é dele.

### 5.2 ✅ O histórico do CRM antigo NÃO será preservado

Decisão: **descartar**. O CRM ainda não teve uso real em produção, e o ambiente novo nasce com
a versão final. **Não é necessário extrair `pg_dump` nem baixar os buckets** — o pedido anterior
está cancelado.

Permanece de pé apenas o encerramento: quando o ambiente novo entrar no ar, **exclua o projeto
Supabase pessoal por inteiro** (não tabela a tabela — Storage e Auth são independentes do
banco), para que dados da Cativa não fiquem em conta pessoal.

### 5.3 ✅ Agência tem UM executivo responsável — mantido como está

Confirmado pela Cativa e pela base de origem: **cada unidade/agência tem um único promotor
(executivo)**. Portanto `agencias.executivo_id` continua sendo campo único — sem tabela N:N.

🟡 **Segue em aberto o outro vínculo, que é diferente:** `executivos.setor` — o departamento
interno usado para rotear **ocorrências** ao perfil `Operacional` (não tem relação com
agências). A pergunta que falta responder é: *uma pessoa do time operacional pode responder por
mais de um setor?* Se a resposta for "sim" ou "talvez", vale nascer com a tabela de vínculo
`executivo_setores`; se for "cada pessoa pertence a um setor só", mantém-se o campo único.
Avise que ajustamos.

### 5.4 ✅ Hospedagem: VPS da Hostinger

Decisão: os três fronts vão para o **VPS da Hostinger** já previsto pela Cativa. Como são
builds estáticos de Vite com fallback de SPA, basta um servidor web configurado para isso
(Nginx, ou EasyPanel se for o caso) + certificado SSL. Assim que os domínios/subdomínios
estiverem definidos, envie-os para configurarmos `site_url` e CORS.

## 6. 🔴 MUDANÇA DE DESENHO — a base de agências virá da Cativa

Esta é a novidade mais relevante para o seu planejamento. **A Cativa fornecerá acesso à base de
unidades (agências) do próprio ambiente de dados**, alimentada diariamente a partir do sistema
de origem. Com isso:

- ❌ **sai** a importação por planilha do Infotera (com todo o processo destrutivo de
  `passo0/passo1/passo3`);
- ❌ **sai** a dependência da futura API do Infotera para esse fim;
- ✅ **entra** uma base já tratada, atualizada todos os dias, consumida por API com login —
  o mesmo modelo usado pelos demais colaboradores da Cativa.

**O que a base tem hoje** (números reais de 11/09/2026): **18.466 unidades**, sendo 18.350
(99,4%) com documento/CNPJ. Colunas disponíveis:

| Campo | Observação |
|---|---|
| `ID_UNIDADE` | **chave estável da origem** — é ela que substitui o `id_infotera` |
| `Unidade` | nome da agência |
| `Cidade`, `Estado`, `Região_Brasil`, `Bairro` | localização (a região já vem derivada da UF) |
| `Contato`, `DDD`, `Telefone` | contato comercial |
| `Ativo?` | situação da unidade na origem |
| `Promotor` | **o executivo responsável** — é o vínculo de §5.3 |
| `Comissao` | regra de comissão |
| `Virtual`, `DT_INCLUSAO` | complementares |
| CNPJ | disponível na origem; será incluído na publicação |

**Como será entregue:** publicaremos essa base no ambiente de dados da Cativa e criaremos um
**login de acesso para o CRM**, com permissão restrita a ela. O consumo é por API REST
(`POST /auth/v1/token` → `GET /rest/v1/<tabela>` com `Authorization: Bearer`), no mesmo padrão
dos outros guias — enviaremos o documento de acesso.

**O que isso pede do seu lado:** uma rotina de **sincronização incremental** (upsert por
`ID_UNIDADE`) alimentando `app.agencias`. As três decisões que você levantou em C6 continuam
valendo e ficam assim:

1. **Agência que sai da base de origem** → **inativar**, nunca apagar (há visitas e ocorrências
   apontando para ela).
2. **Agência criada manualmente no CRM** → não deve existir mais: com a base oficial
   sincronizada, o formulário passa a **rejeitar** agência desconhecida (§5.1). Se ainda assim
   houver cadastro manual, ele nasce sem `ID_UNIDADE` e o sync não o toca.
3. **Campo editado à mão no CRM** → defina quais colunas o sync sobrescreve. Sugestão: o sync
   manda em tudo que vem da origem (nome, endereço, contato, promotor, comissão, situação), e
   campos próprios do CRM (perfil comercial, observações) ficam fora do alcance dele.

## 6.1 Os dois Auth NÃO se confundem (leia antes de criar usuário)

Os dois projetos têm Auth, mas com finalidades opostas — misturar os dois é o erro clássico:

| Projeto | O Auth guarda | Quem cria os usuários |
|---|---|---|
| **CATIVA** (ambiente de dados) | **colaboradores que leem dados** por API, com grupo de acesso | a Cativa, pelo dashboard (*Create user* + Auto Confirm) |
| **CRM_CATIVA_COMERCIAL** (seu projeto) | **os usuários finais do CRM** — executivos, gestores, operacional | o **próprio sistema**, pela Edge Function de administração; a Cativa não cria usuário aqui |

Consequência prática: seu acesso à base de unidades é um **login no CATIVA**; seu acesso ao
banco do CRM é a **string de conexão + chaves** do projeto dele. São credenciais distintas e
não se substituem.

## 7. Próximos passos

| # | Passo | Quem |
|---|---|---|
| 1 | Enviar senha do banco + `sb_secret` por canal seguro | Cativa |
| 2 | ~~Publicar a base de unidades~~ **FEITA 11/09** (`dUnidades`, 18.466 linhas, grupo `unidades`); login de `ti03@cativaoperadora.com.br` criado no CATIVA — guia: `API_UNIDADES_CRM_COMERCIAL.md` | Cativa |
| 3 | Primeira migration: schema `app`, RLS deny-all, `pg_trgm`, buckets, formulário **com login** — aplicada por você com `db push --db-url` (§2.1) | dev |
| 3b | **Primeira publicação das Edge Functions** pelo fluxo de §2.1 (push no repo → aviso → publicação): serve também para medirmos juntos o atrito real do processo | dev + Cativa |
| 4 | Rotina de sincronização das agências por `ID_UNIDADE` | dev |
| 5 | Definir subdomínios no VPS e enviar as URLs | dev + Cativa |
| 6 | Conta **Resend** da Cativa com domínio verificado (hoje nenhum e-mail chega a destinatário real) | Cativa |
| 7 | Excluir o projeto Supabase pessoal, por inteiro | dev |
| 8 | Consolidar os repositórios em `Cativa-Operadora/CRM_CATIVA_COMERCIAL` | dev |
| 9 | Responder o vínculo executivo↔setor (§5.3) | Cativa |

## 8. Contato

Dúvidas, necessidades de administração ou incidentes: **Jean — Cativa Operadora**.
