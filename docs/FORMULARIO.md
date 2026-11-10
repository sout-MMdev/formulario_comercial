# Os apps — Desktop + Mobile

Aplicativo de **registro em campo**: o executivo anota as agências visitadas,
o termômetro de estresse de cada uma, os trajetos (KM) e as despesas do dia.
Dois apps **dividem a mesma lógica** (`packages/nucleo`) e têm cada um a sua
interface.

> O back-end (banco, funções, e-mail) está em
> [`ARQUITETURA.md`](ARQUITETURA.md) e em [`backend/README.md`](../backend/README.md).

---

## 1. Os dois apps

| App | Pasta | Jeito de usar |
|---|---|---|
| **Desktop** | `apps/desktop` | Abas + painel lateral com o resumo ao vivo |
| **Mobile (PWA)** | `apps/mobile` | Passo a passo, uma pergunta por tela, pensado para o toque |

Os dois gravam **o mesmo dado** (`DiaSalvo`) — muda só a forma de navegar.

---

## 2. O que o usuário preenche

**Desktop — abas** (`apps/desktop/src/abas/`):

| Aba | O que registra |
|---|---|
| **Identificação** | Executivo, e-mail e qual relatório preencher; mostra os "Dias salvos" |
| **Visita** | Data da visita e agências visitadas |
| **Agências** | Perfil comercial e termômetro de estresse de cada agência, com ações combinadas |
| **Despesas** | Trajetos (origem → destino, KM) e gastos (cartão, categoria, comprovante) |
| **Resumo** | Confere os totais e salva o dia |

**Mobile — passos** (`apps/mobile/src/passos/`, ordem em `navegacao/passos.ts`):
Quem está preenchendo? → O que você vai registrar? → Quando foi a visita? →
Quais agências você visitou? → Como foi em cada agência? → Quais trajetos você
rodou? → Teve algum gasto? → Confira antes de salvar.

Cada aba/passo tem o **seu `.tsx` e o seu `.css`** — mexer numa não afeta as
outras.

---

## 3. O núcleo compartilhado (`packages/nucleo`)

O "cérebro" que os dois apps (e o servidor) usam. **Só lógica e dados — sem
CSS, sem tela.**

| Pasta | O que tem |
|---|---|
| `regras/` | As **contas** e checagens: reembolso (KM), validação, fluxo das etapas, estresse |
| `servicos/` | `envio` (real e simulado), `armazenamento` (histórico local), `agencias`, `executivos`, `ibge`, `viacep` |
| `config/` | Tarifas, setores, executivos e agências fictícios, URLs |
| `estado/` | `formularioReducer` — o estado do formulário |
| `tipos/` · `utils/` | Tipos + formatadores (moeda, datas, local) |

> Duplicar isto em cada app seria perigoso: uma regra corrigida num lugar e
> esquecida no outro vira bug silencioso. Por isso fica **num lugar só**.

---

## 4. Integração com o back-end

O formulário **não tem login**. Ele fala com o Supabase só por **três Edge
Functions** (a chave de serviço fica no servidor):

| Edge Function | O que faz |
|---|---|
| `listar-executivos` | Nome e e-mail dos executivos ativos |
| `listar-agencias` | Só os **nomes** das agências (para o autocomplete) |
| `receber-formulario` | Valida, recalcula e grava o dia inteiro; manda a cópia por e-mail |

**Modo demonstração:** sem `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, os
serviços usam **dados fictícios** (`envioMock`, listas de `config/`). Com as
variáveis (`TEM_BACKEND`), usam o back-end. Localmente,
`npm run backend:conectar-apps` cria essas variáveis.

**Depois de salvar:** a tela mostra "Relatório enviado" só quando o envio foi
aceito; na falha, mostra o motivo e mantém o formulário preenchido
(`servicos/envio/situacaoEnvio.ts` e `finalizarDia.ts`).

---

## 5. Estrutura de cada app

```
apps/<app>/src/
├── abas/ (desktop) · passos/ (mobile)   uma pasta/arquivo por etapa: .tsx + .css
├── componentes/
│   ├── ui/        botões, campos, modal, seletor de data…
│   ├── layout/    cabeçalho, rodapé, splash, trilha de etapas
│   └── campos/    campo de agência, endereço, arquivo…
├── contexto/      FormularioContexto (liga o reducer do núcleo à tela)
├── hooks/         useDebounce, useDiasSalvos…
├── estilos/       tema/ · root/ · base/ · compartilhado/  (ver @layer abaixo)
└── login/         (só mobile) protótipo da tela de login
```

### Estilos e cascata (@layer)

`estilos/index.css` importa em **camadas**: `tema → root → base → compartilhado`.
O CSS de cada aba/componente fica **fora de camada** e, por regra do CSS,
**sempre vence** o compartilhado. Resultado: você estiliza uma aba no `.css`
dela sem medo de uma classe compartilhada "ganhar" da específica.

---

## 6. Deploy (Vercel)

- **2 projetos** na Vercel: um com raiz `apps/desktop`, outro `apps/mobile`
  (por isso essas pastas não mudam de nome).
- Cada app declara o próprio `typescript`/`vite` nas devDependencies (senão o
  build da Vercel falha com `tsc: command not found`).
- O site publicado roda **sem** as variáveis `VITE_SUPABASE_*`, ou seja, no
  modo demonstração.
