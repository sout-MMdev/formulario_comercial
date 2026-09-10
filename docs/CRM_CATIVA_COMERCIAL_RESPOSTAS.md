# CRM_CATIVA_COMERCIAL — respostas ao levantamento do Supabase

> Resposta ao documento `CRM_CATIVA_COMERCIAL_QUESTIONAMENTOS.md` (10/09/2026).
>
> **Uma observação que muda o enquadramento do documento:** o levantamento parece
> supor um app a ser construído. Não é o caso — **o CRM já existe e está
> funcionando**. Foi desenvolvido entre agosto e setembro de 2026 sobre um projeto
> Supabase que agora está sendo substituído. As respostas abaixo, portanto, não são
> estimativas: na maior parte descrevem **o que já roda em produção**, com o modelo
> de dados, as policies de RLS e as Edge Functions já escritos e testados.
>
> O backend antigo foi retirado do repositório em 10/09/2026 e está documentado em
> `to_delete/ARQUITETURA.md` (o desenho) e `to_delete/ETAPAS.md` (as 15 etapas de
> construção). **Recomendo fortemente ler o `ARQUITETURA.md` antes de dimensionar
> o ambiente** — ele responde §2, §5 e §8 com precisão maior do que qualquer
> resumo aqui.
>
> **Legenda das respostas:**
> - ✅ **Fato** — verificado no código/schema, não é estimativa.
> - 🟡 **Decisão de negócio** — depende da Cativa, não do código. Marcado como *a definir*.
> - 🔴 **Atenção** — ponto que pode travar ou custar caro se não for tratado agora.

---

## 1. Visão geral do produto

### 1.1. O que o CRM_CATIVA_COMERCIAL faz e para quem? Qual problema resolve?

✅ São **dois front-ends compartilhando um único back end**:

| Peça | O que faz | Quem usa |
|---|---|---|
| **Formulário** (desktop + mobile) | Registro em campo: visita à agência, nível de estresse do relacionamento, despesas e trajetos (KM) | Executivos de conta, no dia a dia |
| **CRM** | Gestão: agências, visitas, despesas/reembolso, ocorrências, relatórios, administração | Time comercial + gestão |

O problema que resolve: a visita a campo era registrada de forma dispersa e o
histórico se perdia quando um executivo trocava de região ou saía. O formulário
alimenta o CRM, e **cada registro guarda quem o criou** — então o histórico
permanece íntegro independente de quem cuida da carteira hoje.

### 1.2. Perfis de usuário e volume estimado

✅ **Quatro perfis**, já implementados: `Administrador`, `Gestor`, `Executivo`,
`Operacional`.

🟡 *A definir* — o número de usuários é decisão da Cativa. O que o código indica:
o seed de desenvolvimento tinha **5 executivos + 1 administrador**, e a base
importada do Infotera gerou executivos a partir dos "promotores" da planilha.
A ordem de grandeza é de **dezenas de usuários**, não centenas.

🔴 Vale confirmar esse número, porque ele quase não afeta custo — o que pesa é o
volume de **agências** (§2.2), não de usuários.

### 1.3. Interno, parceiros ou cliente final?

✅ **Interno da Cativa.** Não há acesso de gente de fora.

Uma nuance importante para o dimensionamento: **o formulário não tem login**. Ele
é usado por executivos internos, mas tecnicamente é uma página pública. A proteção
não é autenticação — é que ele só alcança o banco por **três Edge Functions
públicas** que devolvem exclusivamente *nomes* de agências e executivos. Nenhum
CNPJ, endereço ou dado de carteira passa por ali.

As agências parceiras **não são usuárias** — são o objeto do cadastro.

### 1.4. Prazo

🟡 *A definir.* O que já está pronto: o CRM está funcional em todas as áreas
(Agências, Ficha, Despesas, Visitas, Meu Painel, Admin, Ocorrências, Notificações,
Histórico, Estresse). A **única área ainda mock** é *Relatórios* — os blocos leem
dados fictícios e `gerar/baixar/enviar` são simulados.

Na prática, o prazo é determinado por uma coisa só: **quando o novo ambiente
Supabase estiver disponível**, o sistema volta ao ar. Não há desenvolvimento
pendente para produção além dos Relatórios.

### 1.5. Relação com CRM_CATIVA e DISNEY_EXPERT

🟡 *A definir* — não tenho visibilidade desses dois projetos.

✅ Do lado deste app: **hoje é independente**. Não lê nem escreve dados de
nenhum outro sistema Cativa. A única fonte externa é a planilha do Infotera (§4.1).

🔴 **Mas há um histórico relevante aqui.** O projeto Supabase antigo (`Dados_Cativa`)
**não era exclusivo deste app**: o schema `app` convivia no mesmo banco com um
*data warehouse* de bloqueios/IATAs no schema `public`. Se a política nova é
"dados analíticos vivem em outro projeto e são entregues por API", então essa
convivência é exatamente o que **não** deve se repetir. Só que ela também sugere
que alguém, em algum momento, quis os dois juntos — vale entender por quê antes de
separar, para não quebrar um uso que eu desconheça.

---

## 2. Dados que serão armazenados

### 2.1. Entidades principais

✅ **16 tabelas + 1 view**, todas no schema `app`. Já existem, com RLS escrita.

**Núcleo comercial**

| Tabela | O que guarda |
|---|---|
| `executivos` | usuários do sistema (liga ao `auth.users` por `auth_id`) |
| `agencias` | agências parceiras (nome, UF, CNPJ, comissão, endereço, perfil comercial) |
| `visitas` | uma visita a campo, numa data |
| `agencia_visita` | o que foi tratado com cada agência naquela visita |
| `estresse_agencia` | termômetro de relacionamento (Baixo / Médio / Alto / Crítico) |
| `despesas` | gastos de viagem |
| `notas_fiscais` | comprovantes de uma despesa (0..N) |
| `historico_agencia` | linha do tempo única da agência |
| `trajetos` | deslocamentos em KM e o reembolso apurado |

**Ocorrências**

| Tabela | O que guarda |
|---|---|
| `ocorrencias` | problema aberto na ficha da agência (situação, gravidade 1–5, prazo, responsável) |
| `ocorrencia_andamentos` | atualizações ao longo do tratamento |
| `ocorrencia_anexos` | ponteiros para arquivos no Storage |

**Apoio / configuração**

| Tabela | O que guarda |
|---|---|
| `notificacoes` | o sino — criado **só pelo servidor**, via gatilho |
| `permissoes` | catálogo do que existe para permitir (7 permissões) |
| `perfil_permissoes` | mapa perfil → permissões |
| `liberacoes` | feature flags (ligar/desligar sem deploy) |

**View:** `vw_agencias` — entrega a agência no formato exato da tela, com derivados
já calculados (responsável, total de visitas, última visita, estresse atual). Usa
`security_invoker = true`, então o RLS continua valendo por linha.

Duas decisões de modelagem que valem registro:
- `agencia_visita` existe porque **uma visita pode cobrir várias agências no mesmo dia**.
- Listas de tamanho variável (`produtos`, `atendentes`, `acoes`) são `jsonb`, não
  tabelas-filhas — simplicidade deliberada.

O diagrama completo, com colunas e relações, está em `to_delete/ARQUITETURA.md`.

### 2.2. Volume no 1º ano

✅ **`agencias` ≈ 17.000 linhas** — esse é o número real da base do Infotera, e é o
único volume que já está determinado. (O código da Edge Function `listar-agencias`
pagina de mil em mil justamente por causa dele.)

🟡 As demais dependem do tamanho do time e da cadência de visitas. Ordem de
grandeza, assumindo ~10 executivos fazendo ~5 agências/dia em ~22 dias/mês:

| Tabela | Estimativa 1º ano | Observação |
|---|---|---|
| `agencias` | ~17.000 | ✅ fato — cresce pouco, muda por re-importação |
| `executivos` | dezenas | |
| `agencia_visita` | ~10.000–13.000 | 1 linha por agência tratada |
| `visitas` | ~2.500 | 1 por executivo/dia |
| `historico_agencia` | **~20.000+** | **cresce mais rápido** — recebe eventos manuais *e* de sistema |
| `despesas` + `trajetos` | ~5.000–10.000 | |
| `notificacoes` | milhares | cresce junto com ocorrências |
| `ocorrencias` + filhas | centenas a milhares | |

**A que cresce mais rápido é `historico_agencia`** — é feed único, recebe tudo.
Ainda assim, dezenas de milhares de linhas/ano é volume pequeno para Postgres.

🔴 **Conclusão para o dimensionamento:** este app é **leve em volume de dados**.
O que pode pesar é o padrão de acesso do autocomplete, não o tamanho da base (§9.1).

### 2.3. Dado pessoal (LGPD)

✅ Verifiquei campo a campo no schema:

- [x] **nome, e-mail** — de colaboradores internos (`executivos.nome`, `.email`) e
      nomes de atendentes das agências (`agencias.atendentes`, que é uma lista de
      strings, só nomes)
- [ ] ~~CPF/RG/passaporte~~ — **não existe** no modelo
- [x] **endereço** — mas é **endereço comercial da agência** (logradouro, bairro,
      cidade, CEP), não de pessoa física
- [ ] ~~dados de pagamento~~ — **não existe**. Nenhum número de cartão em lugar
      algum. `despesas.cartao` guarda apenas o *rótulo* do meio ("Cartão Pessoal",
      "Cartão Clara"), nunca o número
- [ ] ~~dados sensíveis~~ — **não existe**

✅ Também confirmei que **não há telefone, celular ou WhatsApp** no modelo.

🔴 **Um ponto de atenção que o checklist não cobre:** as **notas fiscais** e os
**anexos de ocorrência** são arquivos enviados por pessoas. Um comprovante de
hospedagem pode conter nome completo, e um anexo de ocorrência pode conter
qualquer coisa. O conteúdo desses arquivos é imprevisível — por isso os dois
buckets são **privados**, com acesso só por URL assinada. Vale a política de
retenção incidir sobre eles (§2.6).

Também há **fotos de colaboradores** (bucket `avatares`, privado) — dado pessoal
por definição.

### 2.4. Arquivos

✅ Dois buckets, **ambos privados**, já existentes:

| Bucket | Conteúdo | Quem escreve |
|---|---|---|
| `ocorrencia-anexos` | imagens e arquivos anexados a ocorrências | qualquer logado; só gestão apaga |
| `avatares` | foto do colaborador | gestão **ou** o próprio dono da pasta |

E `notas_fiscais.arquivo_url` aponta para comprovantes de despesa no Storage.

🟡 *A definir* — tamanho médio e volume mensal. Estimativa razoável: fotos de
comprovante tiradas por celular, **200 KB a 2 MB** cada, algumas por executivo
por semana. Ordem de grandeza: **poucos GB por ano**, não dezenas.

✅ Sobre a regra da casa "arquivo vai para o Storage, nunca dentro de tabela":
**já é assim**. As tabelas guardam só o caminho.

### 2.5. Histórico e auditoria

✅ **Parcialmente, e de propósito.**

O que existe:
- `historico_agencia` é uma **linha do tempo por agência** — tudo que acontece
  aparece nela, com autor, tipo de evento, data e origem (`sistema` ou `manual`).
- Toda tabela relevante guarda **quem criou** (`executivo_id`, `aberto_por`, `autor_id`).
- `ocorrencias` carimba `data_inicio` e `data_resolucao` automaticamente, por gatilho.

O que **não** existe:
- 🔴 **Não há trilha de auditoria genérica de UPDATE.** Se alguém edita o valor de
  uma despesa ou muda o status de uma agência, o valor anterior não fica registrado.

🟡 Se auditoria completa for exigência (LGPD ou controle interno), isso precisa
entrar como decisão agora — a solução usual é uma tabela de auditoria alimentada
por gatilho, e é bem mais barato fazer no desenho inicial do que retroativamente.

### 2.6. Retenção e expurgo

✅ **Não existe política de retenção hoje.** Tudo fica para sempre.

🟡 *A definir.* Duas observações que ajudam a decidir:

1. O modelo foi desenhado para **preservar histórico deliberadamente** — a ideia
   de que "a visita antiga não muda quando o executivo troca de região" é o
   princípio central. Expurgo agressivo brigaria com isso.
2. O candidato natural a expurgo são os **arquivos** (§2.4), não as linhas: anexos
   de ocorrências resolvidas há muito tempo e comprovantes de despesas já
   reembolsadas.

---

## 3. Volume, frequência e padrão de uso

### 3.1. Usuários simultâneos no pico

🟡 *A definir.* Pelo perfil de uso (time comercial interno, dezenas de pessoas),
a expectativa é **menos de 20 simultâneos**, concentrados em horário comercial.

Um detalhe do padrão real: o **formulário** é usado em campo, ao longo do dia, e o
**CRM** é usado no escritório. O pico do formulário tende a ser no fim da tarde,
quando o executivo fecha o relatório do dia.

### 3.2. Operações por dia

🟡 Estimativa, mesma base de cálculo de §2.2:

- **Leituras:** milhares/dia. A tela de Agências consulta a `vw_agencias`, que faz
  dois `lateral join` por linha — é a consulta mais cara do sistema.
- **Escritas:** centenas/dia. Cada relatório de dia fechado grava em ~6 tabelas
  numa tacada só (a Edge Function `receber-formulario`).

Ordem de grandeza: **baixa**. Nada aqui justifica dimensionamento especial.

### 3.3. Importação em massa

✅ **Sim, e já existe o processo.** A base de agências vem da planilha do Infotera
exportada em CSV (~30 colunas, delimitador `;`).

O fluxo, já documentado em `backend/importacao/README.md`:
1. `converter-infotera.js` normaliza o CSV
2. `passo0_limpar_teste.sql` / `passo1_preparar.sql` preparam e criam staging
3. Import do CSV via Table Editor para `app.stg_import`
4. `passo3_transformar.sql` cria os executivos (promotores) e insere as agências

✅ Volume: **~17.000 registros**, em **substituição completa** da base.

🟡 Frequência *a definir* — pelo desenho (apaga tudo e recarrega), a impressão é
que é esporádico, algumas vezes por ano.

🔴 **Este é o ponto mais delicado da migração.** O passo 1 *apaga a base atual*, e
o passo 0 limpa visitas/estresse/ocorrências para não violar chave estrangeira.
Num ambiente novo isso é inofensivo; num ambiente com dados reais, é destrutivo.
Vale revisar esse processo antes de rodá-lo em produção.

### 3.4. Rotinas automáticas

✅ **Nenhuma agendada.** Não há cron, nem job, nem sincronização periódica.

O que existe são **4 gatilhos de banco**, que rodam por evento, não por horário:

| Gatilho | Dispara quando | Faz |
|---|---|---|
| `trg_link_executivo` | novo login criado | liga o login ao executivo pelo e-mail |
| `trg_ocorrencia_notifica` | ocorrência aberta | notifica os executivos do setor + o responsável |
| `trg_ocorrencia_repassada` | responsável muda | notifica o novo responsável |
| `trg_ocorrencia_situacao` | situação muda | carimba data de início/resolução |

### 3.5. Agregações pesadas

✅ Hoje, a consulta mais pesada é a **`vw_agencias`**, que para cada agência calcula
total de visitas, última visita e nível de estresse atual via `lateral join`.

🔴 **Mas a área de Relatórios é o que vem por aí, e ela é toda agregação:**
consolidação por executivo e por período, geração de PDF e envio por e-mail. Hoje
está mock. Quando for implementada de verdade, será a carga mais pesada do sistema.

Vale considerar isso no dimensionamento: não pelo volume de dados (que é pequeno),
mas porque relatório mal escrito sobre 17 mil agências vira *timeout*.

### 3.6. Tempo real (Realtime)

✅ **Não é usado, e não é necessário.** Verifiquei o código: não há nenhum
`channel()` nem subscription de Realtime. A única `subscription` que existe é do
Auth (mudança de estado de login), que é outra coisa.

As notificações do sino funcionam por **consulta sob demanda**, não por push.

🟡 Se o Realtime não for necessário, vale **desligá-lo** no projeto novo — é
superfície de exposição a menos.

---

## 4. Integrações com outros sistemas

### 4.1. Com o que o CRM se integra

✅ **Hoje, duas integrações:**

| Sistema | Como | Estado |
|---|---|---|
| **Infotera / Infotravel** | planilha CSV exportada e importada à mão | ✅ funcionando |
| **Resend** (e-mail transacional) | Edge Function `enviar-email` | ⚠️ funcionando em modo teste |

🟡 *Talvez, sem definição:* o `.env.example` reserva uma variável
`INFOTERA_API_KEY`, o que sugere que **integração por API com o Infotera já foi
cogitada** — mas nunca foi implementada. Vale confirmar se isso está no roteiro,
porque substituiria o processo manual de §3.3.

Não há integração com WhatsApp, ERP, gateway de pagamento ou e-mail marketing.

### 4.2. Webhooks ou API?

✅ **Nenhum webhook.** Nada empurra dados para o Supabase de fora.

O único fluxo de entrada externo é o **formulário**, que chama a Edge Function
pública `receber-formulario` — mas isso é o próprio app, não integração de
terceiro.

### 4.3. Dados analíticos da Cativa

🟡 *A definir* — mas com um alerta importante.

🔴 **O projeto antigo já convivia com dados analíticos.** O schema `app` (este CRM)
morava no mesmo banco que um *data warehouse* de **bloqueios/IATAs** no schema
`public`. Está escrito no cabeçalho da primeira migration: *"schema `app`
(separado do warehouse em `public`)"*.

Isso levanta duas perguntas que precisam de resposta antes de criar o ambiente:

1. **Alguma tela deste CRM lê aquele warehouse?** Pelo que verifiquei no código do
   front, **não** — todas as consultas são no schema `app`. Mas eu não tenho como
   garantir que nenhum SQL manual dependa disso.
2. **Se a separação for feita, o que acontece com o warehouse?** Ele continua onde
   está, e este app simplesmente deixa de compartilhar banco com ele.

Pela leitura do código, **a separação é segura** — este app não precisa de dados
analíticos hoje.

### 4.4. Edge Functions

✅ **Sim, e já existem cinco.** Rodam em **Deno** (não Node), com imports por URL.

| Função | Exige login? | Papel |
|---|---|---|
| `listar-agencias` | não | nomes das agências para o autocomplete (paginado) |
| `listar-executivos` | não | nome + e-mail para o dropdown do formulário |
| `receber-formulario` | não | recebe o relatório do dia e grava em 6 tabelas |
| `enviar-email` | sim | dispara e-mail via Resend |
| `admin-usuarios` | sim + Admin/Gestor | cria login, gera e reseta senha provisória |

✅ Regra de deploy já estabelecida: função **pública** vai com `--no-verify-jwt`;
função do CRM vai **sem** a flag.

O `admin-usuarios` tem **duas camadas**: o `verify_jwt` do Supabase barra quem não
está logado, e por dentro ele confere o perfil — um Executivo logado leva 403.

---

## 5. Autenticação e controle de acesso

### 5.1. Como o usuário entra

✅ **Convite/criação por administrador. Não existe cadastro público.**

O fluxo, já implementado:
1. Admin ou Gestor cria o usuário pela tela de Administração
2. A Edge Function `admin-usuarios` cria o login no Auth **e** o registro em
   `app.executivos`, gerando uma **senha provisória no servidor** (via
   `crypto.getRandomValues`, não `Math.random`) — devolvida **uma única vez**
3. O usuário entra e é obrigado a trocar a senha (flag `precisa_trocar_senha`)

✅ Isso **já é compatível** com o modelo do CRM_CATIVA citado no levantamento
(convite, sem cadastro público). A diferença é que aqui é senha provisória em vez
de token de convite.

Não há login social nem SSO.

### 5.2. Papéis e permissões

✅ Quatro perfis, mas o sistema é **mais rico que uma lista de papéis** — há uma
camada de permissões granulares em banco:

- `permissoes` — catálogo com **7 permissões**: `ver_todos_dados`,
  `acompanhar_ocorrencias`, `editar_status_despesa`, `marcar_nao_reembolsavel`,
  `gerenciar_agencias`, `gerenciar_usuarios`, `importar_agencias`
- `perfil_permissoes` — o mapa perfil → permissões, **editável em tela** pelo admin
- `liberacoes` — feature flags para ligar/desligar funcionalidade sem deploy

🔴 **Sobre pertencer a mais de uma agência/unidade: não é suportado hoje.** O
modelo é o inverso — a *agência* tem um executivo responsável
(`agencias.executivo_id`), e o executivo tem **um** setor. Se o requisito de
múltipla lotação existir, é mudança de modelo, não de configuração. Melhor
decidir agora.

### 5.3. Separação dos dados

✅ **Por usuário, com escalada por perfil.** O princípio, que explica quase todo o
RLS: *"o executivo vê o mundo dele; o gestor vê todos"*.

Na prática:

| Perfil | Enxerga |
|---|---|
| `Administrador` / `Gestor` | tudo |
| `Executivo` | só a carteira dele (agências onde é o responsável) |
| `Operacional` | por **setor** — recebe as ocorrências direcionadas ao setor dele |

✅ Isso já está implementado em **todas** as tabelas, e sustentado por funções
`security definer` que evitam recursão: `ve_tudo()`, `executivo_atual()`,
`agencia_visivel()`, `despesa_visivel()`, `ocorrencia_visivel()`.

Duas exceções deliberadas ao padrão, que valem conhecer:
- **`estresse_agencia`**: entrada vem do formulário, o CRM é somente leitura — só
  quem vê tudo consegue corrigir.
- **`notificacoes`**: **não existe policy de INSERT para usuário**. Só o gatilho
  grava. Assim o cliente nunca escolhe quem recebe a própria notificação.

### 5.4. Recursos de conta

| Recurso | Estado |
|---|---|
| Troca de senha no 1º acesso | ✅ implementado (tela `TrocarSenha` + função `marcar_senha_trocada()`) |
| Recuperação de senha | ✅ via reset administrativo (`admin-usuarios`, ação `resetar-senha`) |
| Autoatendimento "esqueci minha senha" | 🔴 **não existe** — hoje depende de um admin |
| Verificação de e-mail | 🔴 não implementada |
| 2FA | 🔴 não implementado |

🟡 O "esqueci minha senha" por conta própria é a lacuna mais sentida no dia a dia
— vale decidir se entra.

### 5.5. E-mails transacionais

✅ **Sim, via Resend**, por Edge Function. Os segredos (`RESEND_API_KEY`,
`EMAIL_REMETENTE`) ficam nos *Secrets* do Supabase, nunca no front.

🔴 **Pendência conhecida e importante:** o **domínio não está verificado no
Resend**. Em modo teste, o Resend entrega **somente para o dono da conta** — ou
seja, hoje os e-mails do sistema não chegam aos destinatários reais.

Verificar o DNS do domínio é pré-requisito para produção. Não depende do Supabase,
mas trava o uso.

✅ Sobre o SMTP embutido do Supabase: concordo integralmente, e **não usamos** —
já é Resend desde o início.

---

## 6. Ambientes, deploy e desenvolvimento

### 6.1. Ambiente separado de homologação?

🟡 *A definir*, com um dado a favor de "um só resolve":

✅ O front **já roda em modo MOCK offline** quando não há `.env` configurado — dá
para desenvolver tela sem tocar em banco nenhum. Isso cobre boa parte da
necessidade de um ambiente de desenvolvimento.

O que o modo mock **não** cobre: testar migration, RLS e Edge Function. Para isso
o caminho barato é o **Supabase CLI local** (`supabase start`), que roda o stack
inteiro em Docker na máquina, sem custo de projeto extra.

**Recomendação:** um projeto só na nuvem + CLI local para desenvolvimento. Branch
de banco só se houver necessidade real de homologação compartilhada.

### 6.2. Como versionar o banco

✅ **Migrações versionadas no repositório** — 15 migrations, uma por mudança, com
data no nome (`AAAAMMDDHHMMSS_nome.sql`), na regra "mudança nova = arquivo novo,
nunca reescrever migration aplicada".

🔴 **Mas há uma dívida séria aqui, e ela já cobrou o preço.** O CLI nunca foi
ligado — o SQL era **colado à mão no SQL Editor**. O resultado previsível é
*schema drift*: o banco e o repositório saem de sincronia.

**Isso não é hipótese, é fato verificado.** A coluna `app.agencias.id_infotera`
existe no banco (os scripts de importação dependem dela e a usam como chave única),
mas **não aparece em nenhuma das 15 migrations**. Ou seja: já há pelo menos uma
alteração de schema que existe só em produção e que uma reconstrução a partir do
repositório perderia.

**Recomendação forte:** ligar `supabase link` + `supabase db push` **desde o
primeiro dia** do ambiente novo. Aí `migrations/` deixa de ser só histórico e passa
a ser o que realmente aplica. É a diferença entre um repositório que descreve o
banco e um que o define.

### 6.3. Onde o app roda

✅ Hoje: **Vercel** — 3 projetos (formulário desktop, formulário mobile, CRM).
Configuração mínima: um `vercel.json` com rewrite de SPA.

🟡 A Cativa sinalizou que **pode migrar para outra plataforma**. Isso é
tranquilo: o CRM é um build estático de Vite (`dist/`), servível por qualquer host
que faça fallback de SPA. Não há dependência de runtime da Vercel.

Não há necessidade de IP fixo nem restrição de rede.

### 6.4. Quantas pessoas mexem no banco

🟡 *A definir.* Hoje, uma.

---

## 7. Operação, backup e continuidade

### 7.1. Criticidade — perder 24h seria transtorno ou desastre?

🟡 *A definir pela Cativa* — mas com um dado técnico que ajuda a decidir:

**Os dados têm origens de recuperabilidade muito diferentes:**

| Dado | Se perdido |
|---|---|
| `agencias` | **recuperável** — reimporta do Infotera (§3.3) |
| `visitas`, `estresse`, `despesas`, `trajetos` | 🔴 **irrecuperável** — nasceram no campo, não existem em outro lugar |
| `ocorrencias`, `historico` | 🔴 **irrecuperável** |
| Arquivos no Storage | 🔴 **irrecuperável** |

Ou seja: a base cadastral se remonta, mas **o trabalho de campo do dia não**. Um
executivo que rodou a região e fechou o relatório não vai refazer as visitas.

Minha leitura: perder 24h seria **transtorno sério, não catastrófico** — mas a
decisão sobre recuperação ponto-a-ponto (que tem custo) é da Cativa.

### 7.2. Janela de manutenção

🟡 *A definir.* Pelo perfil de uso (time interno, horário comercial), **madrugada e
fim de semana são naturalmente livres**. Não há uso 24/7.

### 7.3. Quem responde por incidente

🟡 *A definir pela Cativa.*

### 7.4. Acesso a logs

🟡 Relatórios periódicos atendem. Não há necessidade de acesso ao painel da
organização — o que se precisa em incidente são os logs das Edge Functions e os
erros de RLS negando acesso indevidamente.

---

## 8. Segurança — confirmação de entendimento

- [x] **8.1. Toda tabela nasce com RLS habilitada e policies junto da migração.**
      ✅ Concordo, e **já é a prática**. Mais que isso: no projeto antigo o RLS era
      ligado em **todas** as tabelas *antes* de existir qualquer policy — o estado
      inicial era *deny-all*, e as permissões iam abrindo a partir daí. Recomendo
      manter esse padrão.

- [x] **8.2. A chave secreta fica só no servidor.**
      ✅ Concordo, e já é assim. A `service_role` vive exclusivamente nas Edge
      Functions. O front usa só a chave pública (`anon`), que é pública por
      design — quem protege o dado é o RLS.
      📝 Nota: o levantamento usa a nomenclatura nova (`sb_secret_`); o código atual
      usa `SUPABASE_SERVICE_ROLE_KEY`. É o mesmo papel, nome novo. Vale alinhar a
      variável na hora de configurar.

- [x] **8.3. As credenciais valem só para o projeto deste app.**
      ✅ De acordo, sem ressalva. Aliás, isso **corrige** a situação anterior, em
      que o app dividia banco com o warehouse de bloqueios/IATAs (§4.3).

- [ ] **8.4. Migrações e código no repositório `Cativa-Operadora/CRM_CATIVA_COMERCIAL`.**
      🔴 **Divergência que precisa ser resolvida.** O código hoje está em:
      - `github.com/sout-MMdev/crm_cativa_comercial` — o CRM
      - `github.com/sout-MMdev/formulario_comercial` — formulário + monorepo

      Ou seja: **conta pessoal, não a organização**, e são **dois repositórios**,
      não um. O levantamento supõe um repositório só, na org.

      Duas decisões necessárias:
      1. **Transferir** os repositórios para `Cativa-Operadora`? (é transferência,
         não cópia — preserva histórico e issues)
      2. O formulário vai junto? Ele **compartilha o mesmo backend**, então separar
         os dois de organização criaria uma fronteira artificial.

      📝 Nota de nomenclatura: padronizei os nomes em **minúsculas**
      (`crm_cativa_comercial`), porque o npm rejeita maiúscula em nome de pacote.
      O levantamento usa `CRM_CATIVA_COMERCIAL`. Vale alinhar qual forma vale para
      o repositório.

- [x] **8.5. Dados pessoais seguem a LGPD.**
      ✅ De acordo. O desenho já favorece isso: coleta mínima (sem CPF, sem
      telefone, sem dado de pagamento — §2.3), buckets privados, e o formulário
      público alcançando **apenas nomes**, nunca a base real.

---

## 9. Espaço para o que não perguntamos

### 9.1. Necessidades técnicas específicas

✅ **Nenhuma extensão exótica.** Sem pgvector, sem PostGIS, sem filas. O que se usa
é Postgres puro + Storage + Auth.

🔴 **Mas há um ponto de escala que vale levantar agora: o autocomplete de agências.**

A Edge Function `listar-agencias` devolve **os ~17 mil nomes de uma vez**, paginando
de mil em mil internamente, e cacheia no CDN por 1 hora. Funciona — mas é uma
resposta grande sendo baixada por cada usuário do formulário, e cresce linearmente
com a base.

A alternativa natural é **busca no servidor** com `pg_trgm` (busca por similaridade,
tolerante a erro de digitação): o cliente manda o que foi digitado, o servidor
devolve 10 resultados. Troca uma resposta de megabytes por uma de bytes, e melhora
a busca (hoje é comparação simples no cliente).

Se o `pg_trgm` for aceitável na política da casa, vale ligar já na criação.

### 9.2. O que já sei que vai dar trabalho

Em ordem de risco:

1. 🔴 **O schema drift do `id_infotera`** (§6.2). Antes de reconstruir o banco no
   ambiente novo, é preciso descobrir **se há outras alterações não versionadas**.
   Como o projeto antigo ainda existe, dá para comparar o schema real com as 15
   migrations e gerar uma migration de reconciliação. **Isso precisa ser feito
   antes de desligar o projeto antigo** — depois, a informação se perde.

2. 🔴 **Os scripts de importação são destrutivos** (§3.3). `passo1_preparar.sql`
   apaga a base de agências, e `passo0` limpa visitas/ocorrências. Precisam de
   revisão antes de rodar em produção com dados reais.

3. 🔴 **O domínio do Resend não está verificado** (§5.5). Enquanto não estiver, os
   e-mails do sistema não chegam a ninguém além do dono da conta.

4. ⚠️ **A área de Relatórios é mock** (§1.4, §3.5). É o único desenvolvimento
   pendente, e é a parte mais pesada em consulta.

5. ⚠️ **Não há "esqueci minha senha" self-service** (§5.4). Toda recuperação passa
   por um admin.

6. ⚠️ **Não há trilha de auditoria de UPDATE** (§2.5). Barato de fazer agora, caro
   de fazer depois.

---

## Resumo executivo — o que trava a decisão

O levantamento diz que §1, §2 e §3 são as que travam a criação do ambiente. Elas
estão respondidas com fato, não estimativa. O resumo:

| Dimensão | Resposta |
|---|---|
| **Porte** | Pequeno. Dezenas de usuários internos, ~17 mil agências, dezenas de milhares de linhas/ano |
| **Público** | Interno da Cativa. Sem acesso externo |
| **Dado pessoal** | Mínimo — nome e e-mail de colaboradores, nomes de atendentes. Sem CPF, telefone ou pagamento |
| **Arquivos** | Dois buckets privados, poucos GB/ano |
| **Carga** | Baixa. Sem Realtime, sem jobs, sem webhooks |
| **Auth** | Convite por admin, sem cadastro público. 4 perfis + permissões granulares |
| **RLS** | Já escrita e testada para todas as 16 tabelas |

**Não vejo argumento de volume para um projeto dedicado** — o app é leve. Se
houver argumento, ele é de **isolamento** (§8.3), não de carga. E esse argumento é
bom: a convivência anterior com o warehouse no mesmo banco é exatamente o que a
política nova quer evitar.

**As três coisas que precisam de resposta da Cativa antes de seguir:**

1. **§8.4** — os repositórios vão para a organização? O formulário vai junto?
2. **§1.5** — há relação prevista com CRM_CATIVA ou DISNEY_EXPERT?
3. **§7.1** — perder 24h de trabalho de campo justifica o custo de recuperação
   ponto-a-ponto?

**E uma que é urgente por prazo, não por decisão:** reconciliar o schema real com
as migrations (§9.2, item 1) **enquanto o projeto antigo ainda existe**.
