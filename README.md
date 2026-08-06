# Relatório Comercial — Cativa Operadora

Sistema de **relatório comercial** dos executivos da Cativa Operadora, em
**dois aplicativos** que dividem a mesma lógica:

| App                       | Para quem                     | Porta |
| ------------------------- | ----------------------------- | ----- |
| **desktop** (`@cativa/desktop`) | Preenchimento no computador   | 5501  |
| **mobile** (`@cativa/mobile`)   | Preenchimento no celular (PWA) | 5502  |

Os dois calculam o reembolso, validam os campos e navegam entre relatórios
usando **exatamente o mesmo código** — o pacote `@cativa/nucleo`. O que muda é
só a interface.

---

## Como rodar

Requisitos: [Node.js](https://nodejs.org/) 20 ou superior.

```bash
npm install          # instala os três pacotes de uma vez

npm run dev:desktop  # http://localhost:5501
npm run dev:mobile   # http://localhost:5502
```

Dá para deixar os dois rodando ao mesmo tempo — as portas são diferentes.

### Testar o mobile no celular de verdade

O servidor já sobe aberto na rede local. Com o celular no **mesmo Wi-Fi**:

```bash
npm run dev:mobile
```

O Vite imprime o endereço de rede (algo como `http://192.168.1.4:5502`).
Abra esse endereço no navegador do celular. O recarregamento automático
funciona: salvou o arquivo, a tela do celular atualiza.

Para instalar como aplicativo, no Chrome do Android use **⋮ → Instalar
aplicativo**; no Safari do iPhone, **Compartilhar → Adicionar à Tela de
Início**. (No iPhone a instalação só aparece em HTTPS ou em `localhost` —
para testar em rede local, use o navegador mesmo.)

### Comandos

| Comando                 | O que faz                                     |
| ----------------------- | --------------------------------------------- |
| `npm run dev:desktop`   | Servidor do app desktop                       |
| `npm run dev:mobile`    | Servidor do app mobile, aberto na rede local  |
| `npm run build`         | Compila os dois apps                          |
| `npm run build:mobile`  | Compila só o mobile                           |
| `npm test`              | Testes das regras de negócio (49 casos)       |
| `npm run typecheck`     | Verificação de tipos dos três pacotes         |

---

## Arquitetura

```
formulario/
├── packages/
│   ├── nucleo/          ← A LÓGICA. Não conhece React nem CSS.
│   │   └── src/
│   │       ├── tipos/       interfaces do domínio
│   │       ├── config/      executivos, tarifas, produtos, setores…
│   │       ├── regras/      reembolso, validação, fluxo, termômetro
│   │       ├── estado/      o reducer do dia (usado pelos 2 apps)
│   │       ├── servicos/    IBGE, ViaCEP, agências, armazenamento
│   │       └── utils/       formatadores
│   │
│   └── tema/            ← A IDENTIDADE VISUAL. Só CSS + ícones.
│       ├── cores.css        a paleta da marca
│       ├── tipografia.css   escala de tamanho e peso
│       ├── efeitos.css      raios, sombras, transições
│       ├── reset.css
│       └── icones.ts        traçados SVG (dados puros, sem React)
│
└── apps/
    ├── desktop/         ← navega por ABAS, campos lado a lado
    │   └── src/{componentes,abas,contexto,estilos}
    │
    └── mobile/          ← navega por PASSOS, um assunto por tela
        └── src/{componentes,passos,navegacao,contexto,estilos}
```

### O que é compartilhado e o que não é

| Camada                            | Compartilhada? |
| --------------------------------- | -------------- |
| Tipos, configuração, regras       | **Sim** — `@cativa/nucleo` |
| Reducer do estado do dia          | **Sim** — `@cativa/nucleo/estado` |
| Serviços (IBGE, ViaCEP, storage)  | **Sim** — `@cativa/nucleo/servicos` |
| Cores, tipografia, ícones         | **Sim** — `@cativa/tema` |
| Dimensões (altura de campo/botão) | Não — cada app tem a sua |
| Componentes de interface          | Não — o toque pede outra coisa |
| Telas                             | Não — abas × passos |

Mudar a tarifa por KM é editar **um arquivo**
([tarifas.ts](packages/nucleo/src/config/tarifas.ts)) e os dois apps passam a
cobrar o valor novo. O mesmo vale para a paleta:
[cores.css](packages/tema/cores.css) é a única fonte da cor da Cativa.

---

## Desktop × mobile

Não é o mesmo app redimensionado. As decisões mudam porque o contexto muda:

| Aspecto            | Desktop                    | Mobile                                  |
| ------------------ | -------------------------- | --------------------------------------- |
| Navegação          | Abas com trilha lateral    | Um passo por tela, barra de progresso   |
| Campos por tela    | 2–3 lado a lado            | Um por vez                              |
| Altura de campo    | 46 px                      | **56 px** (alvo de toque)               |
| Fonte do campo     | 15 px                      | **16 px** (abaixo disso o iOS dá zoom)  |
| Botão de ícone     | 38 px                      | **44 px** (mínimo para o dedo)          |
| Ação principal     | Rodapé do painel           | **Barra fixa na base**, zona do polegar |
| Autocomplete       | Lista suspensa             | **Busca em tela cheia** (o teclado não cobre) |
| Data               | Calendário em modal        | Calendário + atalhos Hoje/Ontem         |
| Nota fiscal        | Selecionar arquivo         | **Tirar foto** ou escolher arquivo      |
| Modal              | Centralizado               | Folha subindo de baixo                  |
| Efeito de toque    | `:hover`                   | `:active` (no toque hover "gruda")      |
| Altura da tela     | `100vh`                    | `100dvh` + safe areas do iPhone         |

### Passos do app mobile

```
1. Quem está preenchendo?     →  2. O que vai registrar?
                                      ├── Visita:   3. Data → 4. Agências → 5. Análise
                                      └── Despesas: 3. Trajetos → 4. Gastos
                                                                      ↓
                                                                  Resumo
```

---

## Regras de negócio

Todas em [`packages/nucleo/src/regras/`](packages/nucleo/src/regras/), em
funções puras — e cobertas por testes.

**Reembolso por KM** — `km × tarifa do executivo`. Padrão R$ 1,30; R$ 1,43 para
os executivos listados em [tarifas.ts](packages/nucleo/src/config/tarifas.ts).
Trocar o executivo recalcula todos os trajetos já lançados.

**Fechamento do dia:**

```
  reembolso de KM
+ despesas no Cartão Pessoal
− abastecimentos no Cartão Clara
= total a reembolsar
```

Outras despesas no Cartão Clara são informativas: aparecem no resumo, mas não
mexem no total.

**Comprovante** — obrigatório no Cartão Pessoal, dispensado no Cartão Clara.
Trocar o cartão limpa categoria e anexo.

**Termômetro** — escolher o nível abre um pop-up que só sai pelo "Entendi".
Níveis Médio, Alto e Crítico exigem a descrição do ocorrido. Cada agência
acumula quantos registros forem necessários.

**Salvar o dia** — exige pelo menos um trajeto ou uma agência visitada.

### Testes

```bash
npm test
```

49 casos cobrindo tarifa, arredondamento, classificação de despesa,
fechamento do dia, validação de cada etapa e montagem do fluxo. Como os dois
apps chamam estas funções, passar aqui significa que **os dois calculam
igual**.

---

## Como estender

| Preciso...                      | Mexo em...                                                       |
| ------------------------------- | ---------------------------------------------------------------- |
| Incluir um executivo            | `packages/nucleo/src/config/executivos.ts`                        |
| Mudar a tarifa por KM           | `packages/nucleo/src/config/tarifas.ts`                           |
| Incluir produto ou atendente    | `packages/nucleo/src/config/agencia.ts`                           |
| Incluir setor ou nível          | `packages/nucleo/src/config/estresse.ts`                          |
| Mudar o cálculo do total        | `packages/nucleo/src/regras/reembolso.ts` (+ atualizar o teste)   |
| Mudar uma cor da marca          | `packages/tema/cores.css`                                         |
| Adicionar um ícone              | `packages/tema/icones.ts` — passa a existir nos dois apps         |
| Adicionar campo ao dia          | tipo em `nucleo/tipos` → ação em `nucleo/estado/formularioReducer.ts` |
| Criar uma aba (desktop)         | `abas/` → mapa em `apps/desktop/src/App.tsx`                      |
| Criar um passo (mobile)         | `passos/` → `navegacao/passos.ts` → mapa em `apps/mobile/src/App.tsx` |

---

## Integração com o CRM

Toda a persistência passa pela interface
[`RepositorioDias`](packages/nucleo/src/servicos/armazenamento/repositorioDias.ts)
— `listar`, `salvar`, `excluir`, `limpar`. Hoje a implementação é
`localStorage`.

Para ligar ao backend:

1. crie `packages/nucleo/src/servicos/armazenamento/repositorioApi.ts`
   implementando a mesma interface com `fetch()`;
2. troque uma linha em
   [`armazenamento/index.ts`](packages/nucleo/src/servicos/armazenamento/index.ts).

**Os dois apps passam a usar a API na mesma hora.** Nenhum componente muda.

O `repositorioLocal` normaliza registros gravados pelas versões anteriores do
formulário, então nenhum dia salvo se perde.

O pacote `@cativa/nucleo` não depende de React nem de DOM de aplicação, e os
imports internos são explícitos — ele roda direto no Node (é assim que os
testes rodam). Pode ser copiado para o CRM ou para uma API sem adaptação.
