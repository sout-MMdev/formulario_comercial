# Login — App Mobile

Desenho da tela de login do app mobile e do caminho até a integração com o
Supabase, combinado em **15/09/2026**. É o guia para quem for codificar: a
**etapa 1 (a tela)** é a de agora; as outras seguem a ordem da §2.

> **Situação:** planejamento de uma funcionalidade futura. Hoje existe só a
> etapa 1 (a tela, em `apps/mobile/src/login/`, aberta com `/?login` e um login
> de teste). O login real não faz parte do back-end local deste repositório
> (ver `docs/ARQUITETURA.md`, "Limitações conhecidas").

---

## 1. Regras que já estão decididas

Não mudar sem falar com a Cativa. A fonte de cada regra está entre parênteses
(links na §13).

- **O formulário exige login**. Isso fecha o `receber-formulario`
  público e tira do ar as listas públicas de agências e de executivos.
- **E-mail e senha**, pelo Supabase Auth (`signInWithPassword`). Sem cadastro
  público, sem login social, sem SSO, sem link mágico.
- **Quem cria as contas é o sistema**, pela Edge Function `admin-usuarios` do CRM,
  com **senha provisória**. No 1º acesso a troca é obrigatória
  (`precisa_trocar_senha` + função `marcar_senha_trocada()`).
- **Não existe "esqueci minha senha" automático.** Quem esquece fala com o gestor,
  que reseta a senha pela administração.
- **O executivo do formulário é o mesmo usuário do CRM:** `app.executivos` se liga
  ao `auth.users` por `auth_id`, e o gatilho `trg_link_executivo` faz essa ligação
  pelo e-mail.
- **Os dois Auth não se confundem**: o login do formulário é o Auth
  do **projeto do CRM**. O projeto CATIVA (base de unidades) tem outro Auth, com
  outra finalidade, e não serve aqui.
- **A chave pública no navegador é pública por natureza.** Quem protege os dados é
  o RLS no servidor; o que a tela mostra ou esconde é só conveniência
  (backend/README).

---

## 2. Etapas

| # | Etapa | Precisa de | Situação |
|---|---|---|---|
| 1 | Tela de login: visual (§3), comportamento (§4) e contrato (§5) | — | **agora** |
| 2 | Serviço de autenticação no núcleo, com login simulado (§6) | 1 | a fazer |
| 3 | Login na entrada do app e "Sair" (§7) | 2 | a fazer |
| 4 | Login real com o Supabase (§8) | 3 e a conta nova pronta | a fazer |
| 5 | Troca da senha provisória no 1º acesso (§9) | 4 | a fazer |
| 6 | Tela de login do desktop (§10) | 2 | a fazer |

Cada etapa termina com o app funcionando, então dá para parar entre uma e outra.

---

## 3. Etapa 1 — o visual

A base é a referência de "cartão de vidro sobre fundo desfocado", adaptada à
marca da Cativa.

### 3.1 A tela, de cima para baixo

```
tela inteira (rola quando o teclado sobe)
│  fundo fixo: arte dos 25 anos desfocada + camada azul escura
│
├── cartão de vidro
│   ├── logo branca da Cativa
│   ├── Boas-vindas!                 (letra manuscrita)
│   ├── ────────────────             (linha fina)
│   ├── RELATÓRIO COMERCIAL          (pequeno, maiúsculas)
│   ├── [envelope] E-mail  ______________________
│   ├── [chave]    Senha   __________________ [olho]
│   ├── [ ] Lembrar meu e-mail
│   ├── (caixa de erro — só quando houver erro)
│   └── [          Entrar          ]    amarelo, largura toda
│
└── rodapé: Esqueceu a senha? Fale com seu gestor.
            Cativa Operadora © 2026
```

### 3.2 Cada elemento

| Elemento | Como fazer | Por quê |
|---|---|---|
| Fundo | Arte dos 25 anos salva em `apps/mobile/public/assets/img/fundo-login.jpg`, reduzida para 800 px (71 KB). Numa camada com `position: fixed` atrás de tudo: `background-size: cover`, `filter: blur(24px)` e `inset: -5rem` (a camada passa das bordas da tela). Cor de reserva: `--cor-marca-900`. | Imagem desfocada não precisa de resolução, então o arquivo fica leve. O desfoque esmaece as beiradas da imagem; com a camada passando das bordas, essa parte fica fora da vista em qualquer tamanho de tela. |
| Camada azul | Por cima do fundo, com a cor `--cor-login-veu`. | Garante a leitura do texto branco. |
| Cartão | Fundo `--cor-vidro`; borda 1px `--cor-vidro-borda`; `--raio-xl`; `backdrop-filter: blur(12px)` **e** `-webkit-backdrop-filter: blur(12px)`; espaço interno `--esp-6`; margem lateral `--esp-5`; largura máxima `--largura-maxima`. | Sem o prefixo `-webkit-`, o vidro não aparece nos iPhones mais antigos. |
| Logo | `apps/mobile/public/assets/img/logo-cativa-branca.png`: versão branca do logo, reduzida para 320 px (24 KB). Na tela, 110 px de largura. O caminho vai numa constante `CAMINHO_LOGO_BRANCA` em `packages/nucleo/src/config/app.ts`, ao lado de `CAMINHO_LOGO`. | A logo azul que o app usa hoje some no fundo azul. |
| Título | "Boas-vindas!" com `--fonte-manuscrita` (Kaushan Script), tamanho `--texto-3xl`, branco, centralizado. | Serve para executivos e executivas. |
| Linha | 1px, cor `--cor-vidro-linha`, entre o título e o nome do app. | Igual à referência. |
| Nome do app | `NOME_APP` do núcleo; `--texto-xs`, `--peso-medio`, `--letra-ampla`, maiúsculas, cor `--cor-vidro-texto-suave`. | Mesmo estilo da tela de abertura. |
| Campos | `<input>` com classe própria — **não** o componente `Entrada`, porque a classe `.controle` desenha caixa e fundo branco. Altura `--altura-campo`, letra `--texto-campo`, fundo transparente, texto branco e só a borda de baixo (1px `--cor-vidro-linha`). No foco, a borda de baixo fica com 2px `--cor-destaque-500`. Espaço à esquerda para o ícone. | Letra de 16px evita o zoom automático do iPhone; 56px é o alvo de toque do app. |
| Ícones dos campos | `email` (já existe) no e-mail e `chave` (novo) na senha, com a cor `--cor-vidro-texto-suave`. | Igual à referência. |
| Olho | `BotaoIcone` com o ícone alternando entre `olho` e `olho_fechado`, e uma classe própria que deixa o ícone branco. | O `BotaoIcone` já garante 44px de área de toque. |
| Lembrar | `<label>` envolvendo um checkbox; a linha inteira é tocável (altura mínima `--toque-minimo`); `accent-color: var(--cor-destaque-500)`. | Toque fácil com o polegar. |
| Erro | Caixa com fundo `--cor-erro-100`, texto `--cor-erro-600`, `--raio-sm`, ícone `alerta` e `role="alert"`. | Texto vermelho direto sobre o azul fica ilegível. O `role="alert"` faz o leitor de tela anunciar o erro. |
| Botão | `<Botao type="submit" variante="destaque" largo>`. | O amarelo é o destaque do app e combina com o dourado dos 25 anos. **Atenção:** o `Botao` usa `type="button"` por padrão; sem `type="submit"` o formulário não envia. |
| Rodapé | Fora do cartão; `--texto-xs`; cor `--cor-vidro-texto-suave`; espaço de baixo somando `--seguro-baixo`. `NOME_EMPRESA` e o ano com `new Date().getFullYear()`, como na tela de abertura. | Sem recuperação automática de senha, o caminho é o gestor. |
| Rolagem | A tela usa `min-height: 100dvh` e o conteúdo começa do topo (espaço `--esp-10` + `--seguro-topo`). **Não** centralizar com posição fixa. | Quando o teclado sobe, a pessoa precisa conseguir rolar até o botão. |

### 3.3 O que acrescentar fora da pasta `login`

**`apps/mobile/src/estilos/tema/cores.css`** — nova seção no fim do `:root`
(o projeto não permite cor escrita direto no componente):

```css
/* ── 7. Login — vidro sobre o fundo desfocado ──────────────────
   Valores de partida: ajuste no olho, já com o fundo real.      */
--cor-vidro: rgba(255, 255, 255, 0.12);
--cor-vidro-borda: rgba(255, 255, 255, 0.28);
--cor-vidro-linha: rgba(255, 255, 255, 0.45);
--cor-vidro-texto-suave: rgba(255, 255, 255, 0.75);
--cor-login-veu: rgba(0, 52, 98, 0.45); /* --cor-marca-900 translúcido */
```

**`apps/mobile/src/estilos/tema/tipografia.css`** — a escala de tamanhos é
fechada, então o tamanho novo entra como variável:

```css
--fonte-manuscrita: "Kaushan Script", cursive;
--texto-3xl: 2.5rem; /* 40px — título manuscrito do login */
```

**`apps/mobile/index.html`** — acrescentar a fonte no link do Google Fonts que já
carrega a Inter. O PWA já guarda as fontes do Google para uso offline.

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Kaushan+Script&display=swap
```

**`apps/mobile/vite.config.ts`** — o `globPatterns` do PWA não inclui `jpg`.
Sem isso, o fundo não entra no cache offline:

```ts
globPatterns: ["**/*.{js,css,html,svg,png,jpg,ico,woff2}"],
```

**Ícones** — os três existem no `react-bootstrap-icons` 1.11.6 instalado:

```ts
// apps/mobile/src/componentes/ui/icones.ts — acrescentar na lista
"olho",
"olho_fechado",
"chave",

// apps/mobile/src/componentes/ui/Icone.tsx — importar Eye, EyeSlash e Key
// de "react-bootstrap-icons" e mapear
olho: Eye,
olho_fechado: EyeSlash,
chave: Key,
```

### 3.4 Nomes

Os arquivos são `src/login/TelaLogin.tsx` e `src/login/TelaLogin.css`;
o `.tsx` importa o CSS com `import "./TelaLogin.css";`.
As classes seguem o padrão do app (`bloco__elemento`):

`login`, `login__fundo`, `login__veu`, `login__cartao`, `login__logo`,
`login__titulo`, `login__linha`, `login__app`, `login__formulario`,
`login__campo`, `login__icone`, `login__entrada`, `login__olho`,
`login__lembrar`, `login__erro`, `login__rodape`.

---

## 4. Etapa 1 — o comportamento

### 4.1 Formulário e teclado

A tela é um `<form>` de verdade, com `noValidate` (as mensagens são as da tela,
não os balões do navegador) e `preventDefault()` no envio.

| Campo | Atributos |
|---|---|
| E-mail | `type="email"` · `name="email"` · `inputMode="email"` · `autoComplete="username"` · `autoCapitalize="off"` · `autoCorrect="off"` · `spellCheck={false}` · `enterKeyHint="next"` |
| Senha | `type` alternando entre `"password"` e `"text"` · `name="senha"` · `autoComplete="current-password"` · `enterKeyHint="go"` |
| Olho | `rotulo` alternando entre "Mostrar senha" e "Ocultar senha" · `aria-pressed` |

Com `autoComplete="username"` e `"current-password"`, o gerenciador de senhas do
celular (Google ou iCloud) reconhece a tela e oferece salvar e preencher.

### 4.2 Ao abrir

- **Com e-mail lembrado:** e-mail preenchido, caixinha marcada, cursor na senha.
- **Sem e-mail lembrado:** campos vazios, caixinha desmarcada e nenhum campo
  focado — o teclado não sobe sozinho por cima da marca.

### 4.3 Ao tocar em Entrar (ou em "Ir" no teclado)

1. Se já está entrando, não faz nada: dois toques não viram duas tentativas.
2. Lê o e-mail e a senha **do próprio formulário**
   (`new FormData(evento.currentTarget)`), não só do estado. O preenchimento
   automático do navegador às vezes não dispara o `onChange` (problema comum em
   telas de login). O e-mail vai sem espaços nas pontas (`trim()`).
3. Confere sem chamar ninguém:
   - algum campo vazio → "Preencha e-mail e senha."
   - e-mail fora do formato (`emailValido`, de `@cativa/nucleo/regras`) →
     "Digite um e-mail válido."
4. Mostra "Entrando...", trava o botão e chama
   `aoEntrar({ email, senha, lembrarEmail })`.
5. **Deu certo:** mantém o "Entrando..." até o app trocar de tela. Quem usa a
   tela decide o próximo passo (§7).
6. **Deu errado:** mostra a mensagem, tira o "Entrando..." e destrava o botão.
   Se o motivo for `credenciais`, apaga a senha e devolve o cursor para ela; nos
   outros motivos, mantém tudo.

A caixa de erro some quando a pessoa volta a digitar.

### 4.4 Mensagens de erro

| Motivo | Quando acontece | Mensagem | O que a tela faz |
|---|---|---|---|
| `credenciais` | E-mail ou senha errados (Supabase: `invalid_credentials`) | E-mail ou senha incorretos. | Apaga a senha e põe o cursor nela |
| `limite` | Muitas tentativas seguidas (`over_request_rate_limit`) | Muitas tentativas. Aguarde um minuto e tente de novo. | Mantém tudo |
| `conexao` | A requisição nem chegou ao servidor (erro sem `code` e sem `status`) | Sem conexão. Verifique a internet e tente de novo. | Mantém tudo |
| `bloqueado` | Conta banida (`user_banned`) ou sem executivo ligado | Acesso bloqueado. Fale com seu gestor. | Mantém tudo |
| `desconhecido` | Qualquer outro caso | Não foi possível entrar. Tente de novo. | Mantém tudo |

> A tela **nunca** diz "e-mail não cadastrado": isso revelaria quais e-mails
> existem no sistema. O próprio Supabase responde `invalid_credentials` nos dois
> casos.

---

## 5. Contrato da tela

É o que liga a tela ao resto do app. Com ele, trocar o login simulado pelo
Supabase (etapa 4) não muda nada na tela.

```ts
/** Quem entrou. `nome` é a chave usada na tarifa por km. */
export interface UsuarioSessao {
  nome: string;
  email: string;
  precisaTrocarSenha: boolean;
}

export type MotivoFalhaLogin =
  | "credenciais"
  | "limite"
  | "conexao"
  | "bloqueado"
  | "desconhecido";

export type ResultadoEntrar =
  | { ok: true; usuario: UsuarioSessao }
  | { ok: false; motivo: MotivoFalhaLogin; mensagem: string };

interface PropsTelaLogin {
  /** E-mail lembrado neste celular ("" se não houver). */
  emailLembrado: string;
  /** Tenta entrar. A tela não sabe se o login é simulado ou real. */
  aoEntrar: (dados: {
    email: string;
    senha: string;
    lembrarEmail: boolean;
  }) => Promise<ResultadoEntrar>;
}
```

- **Etapa 1:** os tipos podem ficar no próprio `TelaLogin.tsx`.
- **Etapa 2:** `UsuarioSessao`, `MotivoFalhaLogin` e `ResultadoEntrar` mudam para
  `packages/nucleo/src/tipos/index.ts`, e a tela passa a importá-los de
  `@cativa/nucleo/tipos`.
- A tela **não** grava o e-mail, **não** fala com o Supabase e **não** troca de
  tela. Ela só mostra e avisa.

### Como ver a tela durante a etapa 1

Enquanto o login não está na entrada do app (§7), um desvio **temporário** no
`apps/mobile/src/App.tsx` mostra a tela quando a URL tem `?login`. Ele entra logo
**depois** dos hooks (`useState` e `useFormulario`), senão o React reclama:

```tsx
// TEMPORÁRIO (etapa 1 do login) — sai na etapa 3 (docs/planejamento/login-mobile.md §7).
// `?login` mostra a tela com um login de teste; `?login=seu@email`
// simula um e-mail lembrado; "erro@teste.com" simula senha errada.
const parametros = new URLSearchParams(window.location.search);
if (parametros.has("login")) {
  return (
    <TelaLogin
      emailLembrado={parametros.get("login") ?? ""}
      aoEntrar={async ({ email }) => {
        await new Promise((esperar) => setTimeout(esperar, 800));
        if (email === "erro@teste.com") {
          return {
            ok: false,
            motivo: "credenciais",
            mensagem: "E-mail ou senha incorretos.",
          };
        }
        window.location.assign("/"); // "entrou": segue para o app
        return {
          ok: true,
          usuario: { nome: "TESTE", email, precisaTrocarSenha: false },
        };
      }}
    />
  );
}
```

- `http://localhost:5502/?login` — a tela vazia.
- `http://localhost:5502/?login=seu@email.com` — como se o e-mail tivesse sido
  lembrado neste celular.
- E-mail `erro@teste.com` com qualquer senha mostra o erro de senha errada.
  Qualquer outro e-mail válido "entra" e segue para o app.

Para testar o teclado de verdade, abra no celular pelo endereço de rede que o
`npm run dev:mobile` mostra no terminal.

---

## 6. Etapa 2 — serviço de autenticação no núcleo

A lógica fica no núcleo porque o desktop vai usar a mesma (etapa 6).

| Arquivo | O que entra |
|---|---|
| `packages/nucleo/src/tipos/index.ts` | Os três tipos da §5. |
| `packages/nucleo/src/config/app.ts` | `CHAVE_EMAIL_LEMBRADO = "cativa_email_lembrado"` e `CHAVE_SESSAO_SIMULADA = "cativa_sessao_simulada"`. |
| `packages/nucleo/src/regras/autenticacao.ts` | `traduzirErroLogin(erro)`, que devolve `{ motivo, mensagem }` seguindo a tabela da §4.4. Recebe só `{ code?, status? }`, sem importar o Supabase, então roda no teste do Node. Exportar em `regras/index.ts`. |
| `packages/nucleo/src/regras/autenticacao.teste.ts` | Um teste por linha da tabela da §4.4. Entra sozinho no `npm test`. |
| `packages/nucleo/src/servicos/autenticacao.ts` | As funções abaixo. O `package.json` do núcleo já exporta `./servicos/*`, então o import `@cativa/nucleo/servicos/autenticacao` funciona sem configurar nada. |

```ts
entrar(email: string, senha: string): Promise<ResultadoEntrar>
sair(): Promise<void>
sessaoAtual(): Promise<UsuarioSessao | null>
/** Avisa quando alguém entra ou sai. Devolve a função que cancela o aviso. */
aoMudarSessao(aoMudar: (usuario: UsuarioSessao | null) => void): () => void
emailLembrado(): string
lembrarEmail(email: string): void
esquecerEmail(): void
```

**Login simulado** (quando não há `.env` com o Supabase, ou seja, `TEM_BACKEND`
é falso):

- `entrar` procura o e-mail, sem diferenciar maiúsculas, em `emailsExecutivos`
  (`config/executivos.ts`). Se achar, entra com qualquer senha, e o `nome` é a
  chave da lista (ex.: `"BRUNO ROCHA"`, que é o que a tarifa por km usa). Se não
  achar, responde com o motivo `credenciais`.
- Espera ~800 ms antes de responder, para o "Entrando..." aparecer.
- Guarda `{ nome, email }` em `CHAVE_SESSAO_SIMULADA`: `sessaoAtual` lê essa
  chave e `sair` apaga. Assim, recarregar a página mantém a pessoa dentro, como
  acontece com o Supabase.
- `precisaTrocarSenha` é sempre `false`.

**Regras do serviço, nos dois modos:**

- Guarda **só o e-mail**, nunca a senha.
- Todo acesso ao `localStorage` fica dentro de `try/catch` (o navegador pode
  bloquear o armazenamento, por exemplo em janela anônima).
- Até a etapa 4 existir, se houver `.env` com o Supabase, `entrar` responde
  `desconhecido`. Não existe atalho que deixe alguém entrar sem conferir a senha.

---

## 7. Etapa 3 — login na entrada do app

### 7.1 Ordem ao abrir

```
Abre o app
  └─ sessaoAtual()   (leitura local, instantânea)
       ├─ ninguém → Login ──(entrou)──┐
       └─ alguém  ────────────────────┴─→ Abertura (Splash) → "O que você vai registrar?"
```

O login vem **antes** da abertura porque a abertura carrega as agências, e
`listar-agencias` passa a exigir login. Quem já entrou uma vez não
vê mais o login: a sessão fica guardada e se renova sozinha.

### 7.2 O que muda

| Arquivo | Mudança |
|---|---|
| `apps/mobile/src/App.tsx` | Guarda a situação da sessão: verificando, fora ou dentro. Verificando: não mostra nada. Fora: tela de login. Dentro: abertura e passos, como hoje. Sai o desvio `?login` da etapa 1. |
| `apps/mobile/src/App.tsx` (ao entrar) | No `aoEntrar` passado para a tela: chama `entrar`; se deu certo, chama `lembrarEmail` ou `esquecerEmail` conforme a caixinha e `despachar({ tipo: "definir-identificacao", dados: { nome, email } })`. |
| `apps/mobile/src/navegacao/passos.ts` | Tira `"executivo"` de `NomePasso`, de `PASSOS` e da sequência, que passa a começar em `["relatorio"]`. |
| `apps/mobile/src/contexto/FormularioContexto.tsx` | Passo inicial `"relatorio"`; saem o atalho `selecionarExecutivo` e o import de `emailDoExecutivo`. |
| `apps/mobile/src/passos/Executivo.tsx` e `Executivo.css` | Apagar. |
| `apps/mobile/src/componentes/layout/TelaPasso.tsx` | Esconde o contador e a barra quando `total` for 1 — senão aparece "1 de 1" com a barra cheia. |
| `apps/mobile/src/componentes/layout/Splash.tsx` | Sai a etapa "Carregando executivos...": o celular não precisa mais da lista. O desktop continua usando `carregarExecutivos` até a etapa 6. |
| `apps/mobile/src/passos/Relatorio.tsx` | Uma linha discreta: "Entrou como **{nome}** · Sair". |

### 7.3 Sair

1. Tocar em "Sair" abre uma `Folha` com o título "Sair da conta?", o texto
   "O que não foi salvo será perdido." e os botões "Cancelar" e "Sair".
2. Se confirmar: `sair()`, depois `despachar({ tipo: "reiniciar" })` **e**
   `despachar({ tipo: "definir-identificacao", dados: { nome: "", email: "" } })`.
   O `reiniciar` sozinho não basta: ele **mantém** quem está preenchendo, de
   propósito ("o executivo é o mesmo o dia todo").
3. Volta para o login. O e-mail lembrado continua lá.

### 7.4 Sessão que cai sozinha

Senha resetada pelo gestor, conta desativada ou token que não renova: o
`aoMudarSessao` avisa `null` (a inscrição fica num `useEffect` do `App.tsx`).

- O login aparece **sem** `reiniciar`. O formulário vive no `ProvedorFormulario`,
  que fica acima do `App` (em `main.tsx`), então nada se perde.
- Se entrar de novo **a mesma pessoa** (mesmo e-mail), ela volta para a tela onde
  estava.
- Se entrar **outra pessoa**: `reiniciar`, `definir-identificacao` com a pessoa
  nova e `irParaPasso("relatorio")`.

---

## 8. Etapa 4 — login real com o Supabase

Só depois que a conta nova do Supabase estiver pronta.

### 8.1 Antes de começar

- [ ] Projeto **do CRM** criado na conta nova. É o Auth dele que guarda os
      executivos.
- [ ] Primeira migration aplicada: `app.executivos` com `auth_id` e
      `precisa_trocar_senha`, o gatilho `trg_link_executivo` e a função
      `marcar_senha_trocada()`.
- [ ] Auth sem cadastro público, com as contas criadas pela Edge Function
      `admin-usuarios`.
- [ ] `apps/mobile/.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
      (a chave **pública**) do projeto novo. O `.gitignore` já ignora `.env.*`.
      **Nunca** coloque a chave secreta no front.

### 8.2 No app

1. Instalar a biblioteca no núcleo:
   `npm install @supabase/supabase-js --workspace @cativa/nucleo` (versão 2).
2. Criar um cliente único no núcleo, só quando `TEM_BACKEND`:
   `createClient(SUPABASE_URL, SUPABASE_ANON)`. As
   opções padrão já guardam a sessão no `localStorage` e renovam o token
   sozinhas.
3. `entrar`: `auth.signInWithPassword({ email, password: senha })`.
   - Erro → `traduzirErroLogin(error)`.
   - Sucesso → buscar o executivo com
     `from("executivos").select("nome, email, precisa_trocar_senha").eq("auth_id", user.id).maybeSingle()`.
   - Sem executivo ligado → `auth.signOut()` e motivo `bloqueado`.
4. `sessaoAtual`: `auth.getSession()` e a mesma busca do executivo.
   `aoMudarSessao`: `auth.onAuthStateChange` (eventos `INITIAL_SESSION`,
   `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`). `sair`: `auth.signOut()`.
5. **Trocar o token das chamadas às Edge Functions.** Hoje
   `servicos/agencias.ts`, `servicos/executivos.ts` e `servicos/envio/envioApi.ts`
   mandam `Authorization: Bearer <chave pública>`. Passam a mandar o token de quem
   entrou (`session.access_token`). O cabeçalho `apikey` continua com a chave
   pública.

### 8.3 No back end

- `listar-agencias`, `listar-executivos` e `receber-formulario` passam a ser
  publicadas **sem** `--no-verify-jwt`.
- **`verify_jwt` sozinho não prova que alguém entrou.** Ele só confere se o token
  é um JWT válido do projeto — e a chave anon antiga também é um JWT válido. Cada
  função precisa confirmar o usuário (`auth.getClaims()` ou `auth.getUser()`) e
  recusar quando não houver.
- `receber-formulario` roda com o usuário autenticado: **sem** `service_role`, com
  o RLS valendo (o executivo grava o que é dele).
- Saem o `obterOuCriarExecutivo` e o `obterOuCriarAgencia`: nada nasce de uma
  requisição do formulário, e agência que não existe na base é recusada.

### 8.4 Pontos de atenção

- **Tarifa por km pelo nome.** `obterTarifaKm` (`regras/reembolso.ts`) compara o
  nome de quem preenche com a lista de tarifa especial. O `nome` que vem de
  `app.executivos` precisa bater com essa lista, ou a tarifa passa a vir do back
  end. Decidir nesta etapa.
- **Sem internet com sessão guardada:** confirmar que o app abre e segue para a
  abertura.
- **Documentos a atualizar:** `docs/FORMULARIO.md` (§4) e `docs/ARQUITETURA.md`
  ainda dizem que o formulário não tem login.

---

## 9. Etapa 5 — primeiro acesso

- Se `usuario.precisaTrocarSenha` for verdadeiro, antes da abertura aparece a tela
  "Crie sua senha": senha nova e confirmação, com o mesmo fundo e o mesmo cartão
  do login.
- Para salvar: `auth.updateUser({ password })` e depois
  `rpc("marcar_senha_trocada")` (a função só mexe na linha da própria pessoa).
- Mensagens próprias para `weak_password` (senha fraca) e `same_password` (igual
  à provisória).

---

## 10. Etapa 6 — desktop

- Usa o **mesmo** serviço do núcleo: as etapas 2 e 4 não se repetem.
- Tela própria em `apps/desktop/src/`, com o mesmo visual e os componentes do
  desktop. As variáveis de vidro, a fonte manuscrita e as duas imagens precisam
  ser acrescentadas também no desktop — cada app tem o seu tema e a sua pasta
  `public`.
- A aba Identificação perde a escolha do executivo (nome e e-mail vêm da conta),
  e o "Sair" vai para o cabeçalho.

---

## 11. Fora deste trabalho

- **"Esqueci minha senha" automático.** Depende de SMTP próprio no Auth (Resend) e
  de um endereço de retorno. Por enquanto, quem esquece fala com o
  gestor.
- **Dias salvos por pessoa.** A lista `cativa_dias_salvos` é do aparelho: se duas
  pessoas usarem o mesmo celular, uma vê os dias da outra.
- **Verificação em duas etapas (2FA).** Não existe no sistema.

---

## 12. Como testar cada etapa

| Etapa | Pronto quando |
|---|---|
| 1 | Em `http://localhost:5502/?login`, com tela de celular: o visual bate com a §3; o olho mostra e esconde a senha; campo vazio e e-mail inválido mostram aviso sem chamar `aoEntrar`; "Entrando..." aparece e trava o botão; `erro@teste.com` mostra o erro e apaga a senha; no celular de verdade, com o teclado aberto, dá para rolar até o botão; `npm run typecheck --workspace @cativa/mobile` passa sem erros. |
| 2 | `npm test` passa, incluindo os testes novos da tradução de erros. |
| 3 | Sem sessão: login → abertura → "O que você vai registrar?". Recarregar a página: vai direto para a abertura. E-mail fora da lista fictícia: "E-mail ou senha incorretos.". "Sair": confirmação e volta ao login com o e-mail lembrado. O passo "Quem está preenchendo?" não aparece mais. Um trajeto de `BRUNO ROCHA` (tarifa especial) continua com a tarifa certa. |
| 4 | Conta real entra; senha errada mostra a mensagem certa; chamada às Edge Functions sem usuário logado é recusada; relatório enviado aparece no CRM em nome de quem entrou. |
| 5 | Conta com senha provisória cai na troca; depois de trocar, não pede de novo. |
| 6 | O roteiro da etapa 3, no desktop (`npm run dev:desktop`). |

---

## 13. Referências

- **Arquitetura atual** (back-end sem login, banco fechado):
  [ARQUITETURA.md](../ARQUITETURA.md)
- **Back-end local** (o papel do RLS e das Edge Functions):
  [backend/README.md](../../backend/README.md)
- **Visão dos apps:** [FORMULARIO.md](../FORMULARIO.md)
- **Supabase Auth com e-mail e senha:**
  [documentação oficial](https://supabase.com/docs/guides/auth/passwords)
