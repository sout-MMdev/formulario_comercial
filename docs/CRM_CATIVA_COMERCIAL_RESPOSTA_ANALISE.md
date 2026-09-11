# CRM_CATIVA_COMERCIAL — resposta à análise e às pendências

> Resposta (11/09/2026) ao documento `CRM_CATIVA_COMERCIAL_ANALISE_E_PENDENCIAS.md`.
>
> De acordo com a decisão de **reconstruir o schema do zero**. É a escolha certa, e
> não só por simplificar a entrada: ela transforma em oportunidade quase tudo o que
> o levantamento anterior apontou como dívida. As melhorias de §C deixam de ser
> refatoração e viram simplesmente *como a coisa nasce*.
>
> **Começo pelo mais importante: os dois achados de segurança de §B procedem.** O §B2
> aponta um erro meu, que corrijo abaixo e já corrigi no documento de origem. E o §B1
> é, na verdade, **mais grave do que a análise descreveu** — detalho em §B1 por quê,
> e por que uma das mitigações sugeridas não funciona.
>
> **Legenda:**
> - ✅ **Confirmado / de acordo** — verificado no código.
> - 🟡 **Depende da Cativa** — não é decisão técnica.
> - 🔴 **Divergência ou alerta** — onde eu discordo, ou onde vejo risco não mapeado.

---

## A. Respostas às pendências

### A1. Encerramento do ambiente atual

**1. Há dados reais da Cativa no ambiente atual?**

✅ **Sim, e de vários tipos.** Sendo específico, porque isso importa para o descarte:

| Dado | Natureza |
|---|---|
| ~17 mil agências | nome, **CNPJ**, endereço, faixa de comissão — vindos da planilha do Infotera |
| Executivos/promotores | nome e **e-mail corporativo**; alguns com **foto** (bucket `avatares`) |
| Visitas, estresse, despesas, trajetos | registros de campo feitos pelos executivos |
| Ocorrências e andamentos | com **anexos** no bucket `ocorrencia-anexos` |
| Usuários do Auth | logins reais, com senha |

Concordo integralmente que isso não deve permanecer em conta pessoal. Para o
descarte ser completo, vale lembrar que **apagar as tabelas não basta**: os dois
buckets de Storage e o pool de usuários do Auth são independentes do banco e
precisam ser apagados também. O caminho mais seguro é **excluir o projeto inteiro**,
não limpar tabela a tabela.

**2. Confirmado que nada será migrado?**

✅ Do meu lado, sem objeção técnica — o ambiente novo nasce limpo.

🔴 **Mas preciso levantar uma consequência que o documento não menciona, porque ela
é irreversível.** O levantamento anterior (§7.1) classificou parte desses dados como
**irrecuperável**, e "começar vazio" significa descartá-los de vez:

| Dado | Recuperável depois? |
|---|---|
| Agências | ✅ sim — reimporta do Infotera |
| Visitas, estresse, despesas, trajetos | ⚠️ **parcialmente** — o formulário guarda cada dia salvo no `localStorage` do dispositivo do executivo, então parte pode ser reenviada |
| **Ocorrências, andamentos, histórico manual, anexos, fotos** | 🔴 **não** — nasceram no CRM, não existem em nenhum outro lugar |

Ou seja: a base cadastral se remonta e parte do trabalho de campo se reenvia, mas
**o histórico de relacionamento construído no CRM some**. Se o sistema acumulou uso
real, alguém precisa decidir isso conscientemente — não como efeito colateral de uma
decisão de arquitetura.

🟡 **O que sugiro:** antes de excluir o projeto antigo, rodar um `pg_dump` do schema
`app` e baixar os dois buckets, guardando em local da Cativa. Custa uma hora, não
atrasa nada, e tira a decisão do caminho crítico. Se depois se concluir que o
histórico não fazia falta, apaga-se o dump. O contrário não é possível.

### A2. Configuração para montar o ambiente

**Secrets das Edge Functions** — ✅ a lista está correta, com uma observação:

| Variável | Origem |
|---|---|
| `RESEND_API_KEY`, `EMAIL_REMETENTE` | manuais, via `supabase secrets set` |
| `INFOTERA_API_KEY` | manual, quando a API existir |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ **não configurar** — o Supabase injeta sozinho no ambiente das funções |

**Auth — `site_url` e redirect URLs** — ✅ resposta precisa, e ela simplifica:

**Hoje não é necessária nenhuma redirect URL.** Verifiquei o código do CRM: os únicos
fluxos de autenticação usados são `signInWithPassword` (login com senha) e
`updateUser` (troca de senha já logado). **Não há magic link, não há OAuth, não há
recuperação por e-mail** — portanto nada que dependa de retorno por URL.

A `site_url` deve apontar para a URL de produção do CRM, e é só isso.

🔴 **Isso muda se C8 for adotado.** "Esqueci minha senha" self-service usa
`resetPasswordForEmail`, que **depende** de redirect URL e de SMTP configurado. As
duas coisas andam juntas — ver C8.

**URLs de produção dos 3 apps** — 🟡 dependem da hospedagem, que está em aberto: a
intenção é sair da Vercel. Assim que a plataforma for decidida, envio as três.

**Storage — limites por bucket** — ✅ de acordo que vale estabelecer. Recomendação
concreta, baseada no uso real:

| Bucket | Limite sugerido | MIME aceitos | Por quê |
|---|---|---|---|
| `avatares` | **2 MB** | `image/jpeg`, `image/png`, `image/webp` | foto de perfil; acima disso é desperdício |
| `ocorrencia-anexos` | **10 MB** | imagens + `application/pdf` | comprovantes e prints; PDF é comum em ocorrência |

🔴 Um alerta sobre `ocorrencia-anexos`: a policy atual permite **qualquer usuário
logado enviar**, sem restrição de tipo. Sem limite de MIME, o bucket aceita
executável. Vale fechar a lista na criação.

**Extensões — `pg_trgm`** — ✅ ótimo. Era a recomendação de §9.1 e resolve o ponto
mais frágil de escala do sistema.

### A3. Contas de terceiros

🟡 Declaração honesta do estado atual:

| Serviço | Conta hoje | Concordo que deve ficar |
|---|---|---|
| **Resend** | pessoal do desenvolvedor | ✅ da Cativa, com domínio da Cativa verificado |
| **Vercel** | pessoal do desenvolvedor | ✅ da Cativa — **mas veja a ressalva abaixo** |
| **GitHub** | pessoal (2 repos) | ✅ acordado: consolidar em `Cativa-Operadora` |

✅ O argumento sobre o Resend está certo e eu subscrevo: enquanto a conta for
pessoal, o domínio verificado e a reputação de entrega pertencem a uma pessoa. E o
§5.5 já registrava que o domínio **não está verificado** — hoje o Resend opera em
modo teste, entregando só para o dono da conta. É pré-requisito de produção, sim.

🔴 **Ressalva sobre a Vercel:** a intenção é **deixar de usá-la**. Criar uma conta
Cativa na Vercel agora pode ser trabalho jogado fora. Sugiro inverter a ordem —
decidir a plataforma de hospedagem primeiro, e abrir a conta corporativa já na
plataforma escolhida. Tecnicamente é indiferente: os três apps são build estático de
Vite, servíveis por qualquer host com fallback de SPA.

### A4. O sistema está fora do ar?

Resposta técnica, separando duas coisas que costumam se confundir:

**Retirar o backend do repositório não derrubou nada.** O que saiu foi o *código
versionado* das migrations e Edge Functions (arquivado em `to_delete/`). O projeto
Supabase antigo, se ainda estiver ativo, continua servindo os apps normalmente.

🟡 Então a resposta depende de um fato que não é meu: **o projeto antigo ainda está
no ar, e há executivos usando?** Se sim, não há urgência de indisponibilidade — há
urgência de *encerramento*, que é outra coisa (§A1). Se o acesso já foi cortado,
então sim, o sistema está parado.

✅ O que posso afirmar: **do lado do desenvolvimento não há nada pendente** para
produção, exceto a área de Relatórios, que segue mock. Assim que o ambiente novo
existir, é configurar `.env`, aplicar as migrations e subir.

### A5. Decisões da Cativa

**§1.2 — número de usuários** — 🟡 uma distinção que ajuda a responder: **nem todo
executivo precisa de login**. O modelo separa as duas coisas — `app.executivos` é o
cadastro (os promotores importados da planilha entram aqui, sem login), e o
`auth_id` só é preenchido para quem realmente acessa o sistema. Então são dois
números: *registros de executivo* (sai da planilha do Infotera, provavelmente
dezenas ou centenas) e *logins ativos* (quem de fato usa o CRM — esse é o que
importa para dimensionar).

**§2.6 — retenção** — 🟡 recomendação concreta: o candidato natural são os
**arquivos**, não as linhas. Sugestão de partida: anexos de ocorrências **resolvidas
há mais de 2 anos** e comprovantes de despesas **já reembolsadas há mais de 5 anos**
(o prazo fiscal costuma ser esse). As linhas eu manteria — o modelo foi desenhado
para preservar histórico, e o volume é pequeno demais para justificar expurgo.

**§5.2 — múltipla lotação** — ✅ concordo integralmente que **agora é a hora barata**,
e tenho uma recomendação. São dois vínculos diferentes, com probabilidades
diferentes de virarem requisito:

| Vínculo | Hoje | Virar múltiplo é plausível? |
|---|---|---|
| Executivo → **setor** (`executivos.setor`) | um só | 🔴 **Sim.** É comum alguém do Operacional cobrir mais de um setor |
| Agência → **executivo responsável** (`agencias.executivo_id`) | um só | 🟢 Menos provável. Carteira com dois donos gera disputa de comissão |

**Minha recomendação:** nascer com uma tabela de vínculo `executivo_setores` (N:N) e
**manter** `agencias.executivo_id` como responsável único. Isso cobre o caso
provável sem complicar o improvável — e a mudança tem efeito direto no RLS, já que
a visibilidade do perfil Operacional é justamente por setor.

**§6.4 / §7.3** — 🟡 decisão da Cativa. Hoje mexe no banco uma pessoa só.

---

## B. Achados de segurança

### B1. 🔴 `receber-formulario` — confirmado, e mais grave do que descrito

✅ **O achado procede inteiramente.** A função é deployada com `--no-verify-jwt`,
roda com `service_role` e grava em 6 tabelas. Confirmei no código.

🔴 **E é pior do que "injetar visitas falsas".** A função não apenas insere linhas em
tabelas existentes — ela **cria entidades**. Verifiquei as funções internas
`obterOuCriarExecutivo` e `obterOuCriarAgencia`: se o nome recebido não existe, ela
**cadastra um executivo novo** (com o e-mail que vier na requisição) e **cadastra uma
agência nova**.

As consequências concretas:

1. Um desconhecido pode **criar registros de executivo** no cadastro da empresa, com
   e-mail arbitrário.
2. Pode **poluir a base de agências** com registros inventados — a mesma base de
   ~17 mil que sustenta o autocomplete e os relatórios.
3. Como a função roda com `service_role`, **o RLS não a barra**. Toda a proteção por
   perfil que o sistema construiu é contornada por esse caminho.

Isso não estava no meu levantamento e deveria estar. É o achado mais importante dos
dois documentos.

🔴 **Sobre as mitigações sugeridas — uma delas não funciona.** "Segredo compartilhado
no header entre front e função" **não é mitigação**: o formulário é um bundle
estático servido ao navegador. Qualquer segredo embutido nele é legível em
`view-source` ou no DevTools. Seria o mesmo erro que o projeto evitou corretamente
com a `service_role` — e vale notar que o próprio §4 do levantamento já enuncia a
regra: *"tudo que vai pro navegador é público"*. Ela se aplica aqui também.

Avaliando as demais:

| Mitigação | Efeito real |
|---|---|
| Captcha / Turnstile | 🟡 detém bot, não detém quem abre o DevTools |
| Rate limit por IP | 🟡 detém inundação, não detém injeção dirigida |
| Token de curta duração de outra função | 🟡 melhora, mas a função emissora também é pública — empurra o problema |
| **Login no formulário** | ✅ **resolve** |

✅ **Minha recomendação: dar login ao formulário.** É o desenho mais limpo, e a
fricção é menor do que parece — **o executivo já é usuário do sistema**, com conta
criada pelo mesmo fluxo do CRM. A sessão do Supabase persiste no dispositivo, então
ele loga uma vez no celular e segue usando.

O ganho vai além de fechar o buraco: com login, `receber-formulario` passa a rodar
**sem** `service_role` e com o RLS valendo, e as funções `listar-agencias` e
`listar-executivos` deixam de ser públicas — o que resolve o §B2 de lambuja. Os três
problemas têm a mesma causa e a mesma cura.

🟡 O que se perde: a conveniência de abrir o formulário e sair preenchendo. Se isso
for inegociável para o negócio, a combinação *Turnstile + rate limit + validação
estrita de entrada* é o segundo melhor — mas é mitigação, não solução, e o risco de
criação de entidades continua de pé (nesse caso, eu removeria o
`obterOuCriar` e passaria a **rejeitar** nome que não exista na base).

### B2. 🔴 `listar-executivos` — confirmado, e o erro é meu

✅ **O achado está certo, e a contradição apontada existe.** Meu §1.3 afirma que as
funções públicas devolvem *"exclusivamente nomes"*. Isso está **errado**: o código
faz `.select("nome, email")`. O §4.4 do mesmo documento descrevia corretamente
"nome + e-mail" — eu me contradisse, e a versão errada era a que tranquilizava.

✅ Já corrigi o `CRM_CATIVA_COMERCIAL_RESPOSTAS.md` na origem, para não circular com
a afirmação incorreta.

E o mérito técnico procede: e-mail corporativo é dado pessoal sob a LGPD e insumo de
phishing dirigido. Expor a lista completa de e-mails do time comercial sem
autenticação é exposição desnecessária.

✅ **De acordo com a recomendação.** Sobre qual das duas saídas: devolver só id +
nome **quebra uma funcionalidade** — o formulário preenche o e-mail do executivo
automaticamente ao selecioná-lo no dropdown, e esse e-mail é usado para enviar a
cópia do relatório do dia.

Então a ordem de preferência é:

1. **Login no formulário** (B1) — a função sai do ar como pública e o problema
   desaparece sem perder função.
2. Se o login não for adotado: devolver **id + nome** na função pública, e o
   servidor resolve o e-mail pelo id na hora de enviar — o e-mail nunca chega ao
   navegador. Mesma funcionalidade, sem exposição.

### B3. ✅ Sobre o que já está correto

Registro apenas o acordo: os seis pontos listados são exatamente os que eu manteria
na reconstrução. O RLS *deny-all* antes de qualquer policy é o que mais vale
preservar — foi ele que garantiu que nenhuma tabela nascesse aberta por esquecimento.

---

## C. Melhorias no desenho inicial

De acordo com **todas as oito**. Abaixo, só onde tenho algo a acrescentar.

| # | Melhoria | Resposta |
|---|---|---|
| **C1** | Migrations pelo CLI | ✅ De acordo, sem ressalva. Era a dívida nº 1 |
| **C2** | `id_infotera` na criação, com unicidade | ✅ De acordo — **com uma ressalva importante, abaixo** |
| **C3** | Trilha de auditoria de UPDATE | ✅ De acordo. Sugiro incluir `perfil_permissoes` além das três citadas |
| **C4** | `pg_trgm` + busca no servidor | ✅ De acordo |
| **C5** | Realtime desligado | ✅ De acordo |
| **C6** | Sincronização incremental | ✅ De acordo — **com uma ressalva, abaixo** |
| **C7** | Schema próprio (`app`) | ✅ De acordo. Já era assim; vale manter |
| **C8** | "Esqueci minha senha" | ✅ De acordo — **tem uma dependência, abaixo** |

### 🔴 C2 — a unicidade precisa aceitar nulo

`id_infotera` deve ser `UNIQUE`, mas **não pode ser `NOT NULL`**. Motivo concreto:
nem toda agência vem do Infotera. A função `receber-formulario` **cria agências pelo
nome** quando o executivo digita uma que não está na base (ver §B1) — essas nascem
sem `id_infotera`.

No Postgres, `UNIQUE` permite múltiplos nulos, então a restrição correta é
simplesmente:

```sql
alter table app.agencias
  add column id_infotera text,
  add constraint agencias_id_infotera_uk unique (id_infotera);
```

Se alguém "endurecer" isso para `NOT NULL` achando que melhora, quebra o cadastro
manual de agência.

### 🔴 C6 — o que a sincronização incremental precisa decidir antes de existir

Trocar *apaga-tudo-e-recarrega* por *upsert* elimina o processo destrutivo, mas o
processo destrutivo resolvia implicitamente três coisas que o upsert **não** resolve.
Vale decidir agora, no desenho:

1. **Agência que sumiu da fonte.** Some do Infotera — apaga, inativa, ou ignora?
   Recomendo **inativar**, nunca apagar: há visitas e ocorrências apontando para ela,
   e a tabela já tem o campo `status` para isso.
2. **Agência criada manualmente** (as sem `id_infotera`). A sincronização **não pode
   tocá-las** — do contrário, o próximo sync apaga o cadastro feito em campo.
3. **Campo editado à mão no CRM.** Se um gestor corrigiu o endereço de uma agência e
   a API traz o valor antigo, o upsert sobrescreve a correção. Ou se aceita isso
   (a fonte manda), ou define-se quais colunas o sync **não** atualiza.

Nenhuma dessas três tem resposta técnica única — são decisões de negócio. Mas
precisam estar respondidas antes de a primeira linha do sync ser escrita.

### 🔴 C8 — depende do Resend, não só do Supabase

"Esqueci minha senha" usa `resetPasswordForEmail`, que envia e-mail **pelo Auth do
Supabase**, não pela Edge Function `enviar-email`. Isso significa duas dependências
que não estão no plano:

1. **SMTP customizado configurado no Auth** — o SMTP embutido do Supabase é limitado
   e não serve para produção (o próprio levantamento original registra isso). Na
   prática: apontar o Auth para o Resend.
2. **Redirect URL** — o link do e-mail precisa voltar para uma rota do CRM, o que
   contradiz o que respondi em §A2. Hoje nenhuma redirect é necessária **porque**
   esse fluxo não existe.

Ou seja, C8 e A3 (conta do Resend) são o mesmo item de trabalho. Faz sentido
tratá-los juntos — e depois de o domínio estar verificado.

---

## D. Ambiente

✅ **De acordo com o projeto dedicado**, e o argumento apresentado é melhor que o
meu. Eu havia observado que não há justificativa de **volume** — e mantenho isso. Mas
o ponto sobre chave secreta, pool do Auth e **restore** serem por projeto é decisivo
e eu não o havia explorado.

O argumento do restore é o mais forte: um incidente em qualquer sistema vizinho
obrigaria a restaurar o banco inteiro, revertendo os dados deste app junto. Isolar
não é preferência organizacional — é condição para conseguir recuperar um sistema
sem prejudicar outro.

✅ **De acordo com backup diário + dump lógico fora do Supabase.** É exatamente o
desenho que eu recomendaria, pelas razões de §7.1: o `localStorage` do formulário
cobre parte do trabalho de campo, mas não cobre ocorrências, histórico nem arquivos.

---

## E. Plano de execução

✅ De acordo com a sequência. Quatro observações:

**1. 🔴 O passo 1 está incompleto.** Ele pede confirmação de §A1 e §A4, mas o §A1 tem
uma decisão embutida que não é do desenvolvedor: **descartar o histórico do CRM**
(ocorrências, andamentos, anexos — ver §A1). Sugiro desmembrar:

> 1a. Extrair `pg_dump` + buckets do ambiente antigo e guardar em local da Cativa *(dev)*
> 1b. Decidir se esse histórico será recarregado ou descartado *(Cativa)*
> 1c. Excluir o projeto antigo — **projeto inteiro**, não tabela a tabela *(dev)*

O passo 1a não atrasa nada e pode correr em paralelo. É barato e irreversível se não
for feito.

**2. 🔴 O passo 6 está tarde demais.** Aplicar §B1 e §B2 *depois* de fazer o deploy das
Edge Functions (passo 5) significa subir o endpoint vulnerável e corrigir em seguida.
Se a decisão for dar login ao formulário, isso **muda o desenho** das funções — elas
deixam de ser públicas. Sugiro decidir §B1 **antes** do passo 3, porque a resposta
afeta a primeira migration (o RLS muda quando o formulário passa a ter usuário
autenticado).

**3. O passo 3 tem uma especificação pronta.** `to_delete/ARQUITETURA.md` descreve o
schema inteiro — 16 tabelas, 13 funções, 4 gatilhos, as policies e as decisões por
trás delas. E `to_delete/ETAPAS.md` registra a ordem em que cada coisa surgiu e por
quê. Recomendo usá-los como especificação; **não** colar o SQL antigo, que carrega as
dívidas que estamos justamente eliminando.

Aproveitando: como tudo será refeito, as 15 migrations viram **uma migration inicial
limpa** — organizada por funcionalidade, com o RLS colado à tabela que ele protege,
em vez de 15 arquivos que refletem a ordem histórica de descoberta.

**4. Falta um item pós-entrada.** A área de **Relatórios** segue mock (§1.4) — é o
único desenvolvimento pendente, e a parte mais pesada em consulta. Não trava a
entrada no ar, mas vale estar na lista para não ser esquecida.

---

## Resumo — o que depende de quem

**Do meu lado, respondido e sem pendência:** §A1 item 1 (que dados existem), §A2
(secrets, redirect URLs, limites de Storage), §A4 (nada pendente no
desenvolvimento), §B1 e §B2 (confirmados, com recomendação), §C (de acordo com as 8,
com três ressalvas técnicas).

**Preciso de decisão da Cativa:**

| # | Decisão | Por que trava |
|---|---|---|
| 1 | **Formulário com login?** (§B1) | Afeta a primeira migration e o desenho das Edge Functions — precisa vir antes do passo 3 |
| 2 | **O histórico do CRM será preservado?** (§A1) | Irreversível. O dump é barato; a decisão pode vir depois, o dump não |
| 3 | **Múltipla lotação por setor?** (§5.2) | Muda o modelo e o RLS. Barato agora, caro depois |
| 4 | Plataforma de hospedagem | Define as URLs de §A2 e se vale abrir conta Vercel (§A3) |

**Depende de mim, e já está encaminhado:** consolidar os repositórios em
`Cativa-Operadora` (passo 9) e enviar as URLs de produção assim que a plataforma for
decidida.
