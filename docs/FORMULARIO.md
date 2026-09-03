# Formulário Comercial — Desktop + Mobile

Aplicativo de **registro em campo**: o executivo anota a visita à agência, o
nível de estresse, as despesas e os trajetos (KM) do dia. Dois apps que
**dividem a mesma lógica** (`packages/nucleo`) mas têm cada um a sua interface.

---

## 1. Os dois apps

| App | Pasta | Cara |
|---|---|---|
| **Desktop** | `apps/desktop` | Abas + painel lateral com resumo ao vivo |
| **Mobile** | `apps/mobile` | Passo a passo (uma tela por etapa), pensado pra toque |

Os dois gravam **o mesmo dado**, no mesmo back end — muda só a forma de navegar.

---

## 2. O que o usuário preenche

**Desktop — abas** (`apps/desktop/src/abas/`):

| Aba | O que registra |
|---|---|
| **Identificação** | Executivo + data; retoma "dias salvos" |
| **Visita** | Nível de estresse (termômetro) + setores + observações |
| **Agências** | Agências visitadas, ações acordadas, perfil da agência |
| **Despesas** | Gastos (cartão/categoria/nota) + trajetos (origem→destino, KM) |
| **Resumo** | Confere tudo e envia |

**Mobile — passos** (`apps/mobile/src/passos/`): Executivo → Data da visita →
Agências visitadas → Trajetos → Gastos → Análise → Resumo → Relatório.

Cada aba/passo tem **o seu `.tsx` e o seu `.css`** na própria pasta — mexer numa
não afeta as outras.

---

## 3. O núcleo compartilhado (`packages/nucleo`)

O "cérebro" que os dois apps usam. **Só lógica e dados — sem CSS, sem tela.**

| Pasta | O que tem |
|---|---|
| `regras/` | As **contas**: reembolso (KM), validação, fluxo das etapas, estresse |
| `servicos/` | `envio` (manda pro back end), `agencias`, `executivos`, `viacep`, `ibge`, `armazenamento` (rascunho local) |
| `config/` | Tarifas, setores, executivos, passos do fluxo |
| `estado/` | `formularioReducer` — o estado do formulário |
| `tipos/` · `utils/` | Tipos + utilidades (formatadores, identificador) |

> Duplicar isto em cada app seria perigoso: uma regra corrigida num lugar e
> esquecida no outro vira bug silencioso. Por isso fica **num lugar só**.

---

## 4. Integração com o back end

O formulário **não tem login**. Ele fala com o Supabase só por **Edge Functions
públicas** (a chave de serviço fica no servidor):

| Edge Function | Devolve/faz |
|---|---|
| `listar-agencias` | Só os **nomes** das agências (pro autocomplete) |
| `listar-executivos` | Nome + e-mail dos executivos ativos |
| `receber-formulario` | Grava a visita: `visitas`, `agencia_visita`, `estresse_agencia`, `historico_agencia`, `despesas`, `trajetos` + manda cópia por e-mail |

**Fallback por LGPD:** sem `VITE_SUPABASE_URL/ANON_KEY`, os serviços caem em
**dados fictícios** (`envioMock`, listas fictícias). Assim o repositório pode ir
público sem vazar dado real. Quando as variáveis existem (`TEM_BACKEND`), busca
do back end de verdade.

---

## 5. Estrutura de cada app

```
apps/<app>/src/
├── abas/ (desktop) · passos/ (mobile)   uma pasta por etapa: .tsx + .css
├── componentes/
│   ├── ui/        botões, campos, modal, seletor de data…
│   ├── layout/    cabeçalho, rodapé, splash, trilha de etapas
│   └── campos/    campo de agência, endereço, arquivo…
├── contexto/      FormularioContexto (liga o reducer do núcleo à tela)
├── hooks/         useDebounce, useDiasSalvos…
└── estilos/       tema/ · root/ · base/ · compartilhado/  (ver @layer abaixo)
```

### Estilos e cascata (@layer)

`estilos/index.css` importa em **camadas**: `tema → root → base → compartilhado`.
O CSS de cada aba/componente fica **fora de camada** e, por regra do CSS, **sempre
vence** o compartilhado. Resultado: você estiliza uma aba no `.css` dela sem medo
de uma classe compartilhada "ganhar" da específica.

---

## 6. Deploy (Vercel)

- **2 projetos** no Vercel: um com raiz `apps/desktop`, outro `apps/mobile`.
- Cada app declara o próprio `typescript`/`vite` nas devDependencies (senão o
  build da Vercel falha com `tsc: command not found`).
- Variáveis: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` apontando pro projeto
  Supabase. Sem elas → modo fictício (não quebra).

---

## 7. Estado

✅ Desktop e mobile **ligados ao back end**, com fallback fictício. Builds OK,
regras cobertas por testes (núcleo 49/49). Sem mock problemático — o único
"mock" (`envioMock`) é o fallback **de propósito**.
