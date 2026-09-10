# Arquitetura do backend Supabase (versão antiga)

Este é o **desenho** do backend que rodava no projeto Supabase antigo. Serve
como especificação de referência para montar o novo — não como script a colar.

---

## 1. O princípio que organiza tudo

> **O executivo vê o mundo dele; o gestor vê todos.**

Essa única frase explica quase todo o RLS. Cada registro guarda **quem o
criou**, e a visibilidade deriva daí. O efeito colateral desejado: se um
executivo troca de região ou sai da empresa, **o histórico não se mexe** — a
visita que ele fez continua sendo dele.

Daí vem a distinção mais importante do modelo:

| Campo | Significado | Muda com o tempo? |
|---|---|---|
| `agencias.executivo_id` | responsável **atual** pela agência | **Sim** — troca quando a carteira muda |
| `visitas.executivo_id` | quem **fez** aquela visita | **Nunca** — é registro histórico |

## 2. Separação de schemas

```
public   →  warehouse (dados brutos, importação)
app      →  o CRM (tudo o que este backup documenta)
auth     →  logins (gerenciado pelo Supabase)
storage  →  arquivos (gerenciado pelo Supabase)
```

Tudo do CRM vive em **`app`**. O schema começou nem exposto ao PostgREST — o
estado seguro por padrão.

## 3. Perfis de acesso

Quatro perfis, espelhando o tipo `PerfilUsuario` do front:

| Perfil | Alcance |
|---|---|
| `Administrador` | vê tudo, administra usuários |
| `Gestor` | vê tudo |
| `Executivo` | vê só a carteira dele |
| `Operacional` | acesso por **setor** (recebe ocorrências do setor) |

"Ver tudo" = `Administrador` ou `Gestor`. Isso está numa função só,
`app.ve_tudo()`, usada por quase toda política.

## 4. As 16 tabelas

### Núcleo comercial (fase 1)

| Tabela | O que guarda | Ligações |
|---|---|---|
| `executivos` | usuários do sistema | `auth_id` → `auth.users` |
| `agencias` | agências parceiras | `executivo_id` → responsável atual |
| `visitas` | uma visita a campo, numa data | `executivo_id` (histórico) |
| `agencia_visita` | o que foi tratado com cada agência na visita | `visita_id`, `agencia_id` |
| `estresse_agencia` | termômetro de relacionamento (Baixo→Crítico) | `agencia_id`, `visita_id` (opcional) |
| `despesas` | gastos de viagem | `executivo_id` |
| `notas_fiscais` | comprovantes de uma despesa (0..N) | `despesa_id` |
| `historico_agencia` | linha do tempo única da agência | `agencia_id` |

Detalhe de modelagem: `agencia_visita` existe porque **uma visita pode cobrir
várias agências no mesmo dia**. E listas de tamanho variável (`produtos`,
`atendentes`, `acoes`) são `jsonb`, não tabelas-filhas — decisão consciente
de simplicidade.

### Ocorrências

| Tabela | O que guarda |
|---|---|
| `ocorrencias` | problema aberto na ficha da agência (situação, gravidade 1–5, prazo, responsável) |
| `ocorrencia_andamentos` | as atualizações ao longo do tratamento |
| `ocorrencia_anexos` | imagens/arquivos (ponteiro para o Storage) |

### Apoio

| Tabela | O que guarda |
|---|---|
| `notificacoes` | o sino — criado **só pelo servidor**, via gatilho |
| `permissoes` | catálogo do que existe para permitir |
| `perfil_permissoes` | mapa perfil → permissões |
| `liberacoes` | feature flags (ligar/desligar sem deploy) |
| `trajetos` | deslocamentos em KM e o reembolso apurado |

### View

`vw_agencias` — entrega a agência **no formato exato que a tela espera**, já
com os campos derivados calculados (responsável, total de visitas, última
visita, nível de estresse atual). Usa `security_invoker = true`, então o RLS
de cada tabela continua valendo para o usuário logado. Grant **só** para
`authenticated` — a chave pública do formulário nunca lê CNPJ nem comissão.

## 5. Segurança (RLS)

O RLS foi ligado em **todas** as tabelas já na criação, antes de existir
qualquer política — ou seja, o estado inicial é *deny-all*. Política só entra
depois, liberando o mínimo.

### As funções que sustentam as políticas

Todas são `security definer` com `search_path` fixo — rodam como dono, o que
evita recursão infinita (a política de `executivos` precisa ler `executivos`).

| Função | Devolve |
|---|---|
| `app.executivo_atual()` | id do executivo logado (ou NULL) |
| `app.perfil_atual()` | perfil do logado |
| `app.ve_tudo()` | é Administrador ou Gestor? |
| `app.agencia_visivel(id)` | vê tudo, **ou** é o responsável |
| `app.despesa_visivel(id)` | vê tudo, **ou** a despesa é dele |
| `app.ocorrencia_visivel(id)` | segue a visibilidade da agência |

### O padrão que se repete

Quase toda tabela segue a mesma forma:

```sql
select → app.ve_tudo() or <é meu>
insert → <é meu> or app.ve_tudo()
update → app.ve_tudo()          (ou "meu", quando faz sentido editar)
delete → app.ve_tudo()          (quase sempre só gestão)
```

Exceções que valem notar:

- **`estresse_agencia`**: entrada vem do formulário; o CRM é somente leitura.
  Usuário comum não dá `update` — só quem vê tudo corrige.
- **`notificacoes`**: **não existe** política de INSERT para usuário. Só o
  gatilho grava (`security definer`). Assim o cliente nunca escolhe o
  destinatário da própria notificação.
- **`permissoes` / `liberacoes`**: leitura liberada a todo logado (o app
  precisa saber o que pode), edição só para quem vê tudo.

## 6. Gatilhos (a regra de negócio no servidor)

| Gatilho | Quando | O que faz |
|---|---|---|
| `trg_link_executivo` | novo login em `auth.users` | liga o login ao executivo cadastrado, pelo e-mail |
| `trg_ocorrencia_notifica` | abriu ocorrência | notifica os executivos **do setor** + o responsável escolhido |
| `trg_ocorrencia_repassada` | mudou `responsavel_id` | notifica o novo responsável |
| `trg_ocorrencia_situacao` | mudou a situação | carimba `data_inicio` / `data_resolucao` automaticamente |

Padrão: **notificação nunca é decidida pelo cliente.** O servidor decide quem
recebe.

## 7. Storage

Dois buckets, ambos **privados** (acesso via URL assinada):

| Bucket | Conteúdo | Quem escreve |
|---|---|---|
| `ocorrencia-anexos` | imagens/arquivos das ocorrências | qualquer logado; só gestão apaga |
| `avatares` | foto do colaborador | gestão **ou** o próprio dono da pasta |

O caso do `avatares` tem uma trava que vale reaproveitar: o usuário só escreve
na **própria pasta**, garantido no path —

```sql
(storage.foldername(name))[1] = auth.uid()::text
```

— e no banco, funções `security definer` que mexem **só na própria linha** e
**só no campo `foto_url`** (`definir_minha_foto`, `remover_minha_foto`). Não
dá para usá-las para virar Administrador nem tocar em outra linha. A mesma
ideia protege `marcar_senha_trocada()`, do primeiro acesso.

## 8. Edge Functions (Deno)

Rodam no servidor. É onde vivem os segredos (`service_role`, chave do Resend)
— **nunca** no front.

| Função | Login? | Papel |
|---|---|---|
| `listar-agencias` | não | nomes das agências para o autocomplete (paginado, ~17 mil registros) |
| `listar-executivos` | não | nome + e-mail para o dropdown do formulário |
| `receber-formulario` | não | **a mais importante** — recebe o relatório do dia e grava em 6 tabelas |
| `enviar-email` | sim | dispara e-mail via Resend |
| `admin-usuarios` | sim + Admin/Gestor | cria login, gera senha provisória, reseta senha |

Regra de deploy: função **pública** vai com `--no-verify-jwt`; função do CRM
vai **sem** a flag.

O `admin-usuarios` tem **duas camadas** de segurança: o `verify_jwt` do
Supabase barra quem não está logado, e por dentro ele confere o **perfil** —
um Executivo logado bate na porta e leva 403. A senha é gerada no servidor
com `crypto.getRandomValues` (não `Math.random`) e devolvida **uma vez**.

### O fluxo do formulário (o caminho crítico)

```
Formulário (sem login)
   └─→ receber-formulario  (service_role)
         ├─ obtém ou cria executivo (pelo nome)
         ├─ obtém ou cria agência (pelo nome)
         ├─ grava visita  →  agencia_visita
         ├─ grava estresse_agencia
         ├─ grava historico_agencia
         ├─ grava trajetos
         ├─ grava despesas
         └─→ e-mail de cópia para o executivo (Resend)
```

O cliente **nunca** fala direto com o banco. Só a função escreve.

## 9. Segredos (nunca no git)

| Onde | Variáveis |
|---|---|
| Front (público, vai no bundle) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Edge Functions (injetados) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Edge Functions (manuais) | `RESEND_API_KEY`, `EMAIL_REMETENTE` |

A chave `anon` é pública **por design** — quem protege os dados é o RLS. A
`service_role` nunca sai do servidor.

## 10. Como o SQL era aplicado

O CLI/MCP não estava ligado: o SQL era colado **à mão** no SQL Editor, na
ordem das migrations.

Isso era uma dívida conhecida. Com o acesso novo, vale ligar o
`supabase link` + `supabase db push` desde o começo — aí `migrations/` deixa
de ser só histórico e passa a ser o que **realmente aplica**.
