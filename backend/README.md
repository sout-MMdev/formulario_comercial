# 🔌 Back-end — Supabase local (PostgreSQL + Edge Functions)

O servidor do Formulário Comercial: banco PostgreSQL com RLS, três Edge
Functions em Deno e uma caixa de e-mail de teste. Tudo roda **na sua máquina,
com Docker**, sem conta no Supabase. Os dados são fictícios.

> Como as peças se encaixam (com diagramas): [`docs/ARQUITETURA.md`](../docs/ARQUITETURA.md).

---

## O que tem nesta pasta

```
backend/
├── supabase/
│   ├── config.toml               configuração do Supabase local (portas, funções)
│   ├── migrations/               o banco, em ordem de criação
│   │   ├── …_schema_inicial.sql      9 tabelas, enums, RLS e permissões
│   │   ├── …_registrar_relatorio.sql grava um relatório inteiro numa transação
│   │   ├── …_views_gestao.sql        reembolso mensal e agências em alerta
│   │   └── …_views_horario_brasilia.sql as views contam o dia no horário de Brasília
│   ├── seed.sql                  dados fictícios: 12 executivos, 24 agências, 3 relatórios
│   ├── tests/                    testes do banco (pgTAP)
│   └── functions/                Edge Functions (Deno)
│       ├── _compartilhado/       código comum, um arquivo por responsabilidade:
│       │   ├── http.ts               CORS, chave pública, limite de corpo, erros 4xx/5xx
│       │   ├── validacao.ts          confere o corpo + regras da tela (núcleo)
│       │   ├── montagem.ts           recalcula o dinheiro e monta o payload do banco
│       │   ├── processar.ts          o passo a passo do envio (sem Deno, testável)
│       │   ├── email.ts              cópia por e-mail (adaptador do Mailpit)
│       │   ├── servidor.ts           liga tudo ao Supabase de verdade (Deno)
│       │   ├── nucleo.ts             única porta para packages/nucleo
│       │   └── tipos.ts              formatos dos dados do servidor
│       ├── listar-executivos/    GET  → [{ nome, email }]
│       ├── listar-agencias/      GET  → ["Turismo Aurora", …]
│       └── receber-formulario/   POST → grava o dia e manda a cópia
├── testes/
│   ├── unidade/                  testam o _compartilhado no Node (sem Docker)
│   └── integracao/               chamam as funções pela rede (precisa do Supabase local)
└── scripts/                      liga/desliga os apps do back-end local
```

---

## Pré-requisitos

- **Docker Desktop** aberto.
- **Node.js 22.18 ou mais novo** (o CI usa o 24). Os testes rodam TypeScript
  direto no Node.
- `npm install` na raiz do repositório.

O Supabase CLI não precisa ser instalado: os scripts usam
`npx supabase@2.122.0` (versão fixa).

---

## Rodar, do zero

```bash
npm run backend:iniciar        # sobe banco, funções e e-mail (1ª vez baixa as imagens)
npm run backend:conectar-apps  # liga os apps ao back-end local (cria apps/*/.env.local)
npm run dev:desktop            # http://localhost:5501
```

Preencha um relatório e clique em **Salvar o dia**. Depois confira:

| O quê | Onde |
|---|---|
| As linhas gravadas (tabela `relatorios` e filhas) | Studio: http://127.0.0.1:54323 |
| A cópia por e-mail | Mailpit: http://127.0.0.1:54324 |
| As views de gestão | Studio → SQL: `select * from v_reembolso_mensal;` |

Para voltar ao modo demonstração e desligar tudo:

```bash
npm run backend:desconectar-apps   # apaga apps/*/.env.local
npm run backend:parar
```

### Endereços locais

| Serviço | Endereço |
|---|---|
| API (Kong) e funções | http://127.0.0.1:54321 · `/functions/v1/<nome>` |
| Banco PostgreSQL | `127.0.0.1:54322` |
| Studio (painel) | http://127.0.0.1:54323 |
| Mailpit (e-mail) | http://127.0.0.1:54324 |

---

## Comandos

| Comando | O que faz |
|---|---|
| `npm run backend:iniciar` | Sobe o Supabase local (aplica migrations e seed na primeira vez) |
| `npm run backend:parar` | Desliga (os dados ficam guardados) |
| `npm run backend:status` | Mostra endereços e chaves locais |
| `npm run backend:resetar` | Recria o banco do zero: migrations + seed |
| `npm run backend:conectar-apps` | Escreve `apps/*/.env.local` com URL e chave pública locais |
| `npm run backend:desconectar-apps` | Apaga os `.env.local` (apps voltam ao modo demonstração) |
| `npm run backend:testar-banco` | Testes do banco (pgTAP) |
| `npm run backend:testar-funcoes` | Testes de integração das funções |
| `npm run backend:testar` | Os dois acima |
| `npm run backend:checar-funcoes` | Checa os tipos do código Deno das funções (`deno check`, sem Docker) |
| `npm test` (raiz) | Testes de unidade do núcleo e do back-end (sem Docker) |

---

## Onde mexer para…

| Mudança | Onde | Não esqueça |
|---|---|---|
| Nova coluna ou tabela | Nova migration: `npx -y supabase@2.122.0 migration new <nome> --workdir backend` | RLS + `revoke` para `anon`/`authenticated`; teste em `supabase/tests/` |
| Regra de cálculo ou validação | `packages/nucleo/src/regras/` | Tela e servidor mudam juntos; se for classificação de despesa, ajuste a view `v_reembolso_mensal` |
| Nova Edge Function | Pasta em `supabase/functions/<nome>/index.ts` usando `criarTratador` | Bloco `[functions.<nome>] verify_jwt = false` no `config.toml` e teste de integração |
| Provedor de e-mail real | Novo adaptador com o método `enviar()` de `EnviadorEmail` (`email.ts`) | A chave do provedor vai em variável de ambiente, nunca no código |
| Dados de exemplo | `supabase/seed.sql` | Só dados fictícios (`@empresa.exemplo`) |

---

## Segurança

- Nenhuma chave fica no código: scripts e testes leem do `supabase status`.
- O navegador usa só a **chave pública**; a **chave de serviço** existe apenas
  dentro das funções.
- Arquivos `.env*` estão no `.gitignore` (só o `.env.example` é versionado).

---

## Problemas comuns

- **"Supabase local parado"** nos testes de integração: rode
  `npm run backend:iniciar` antes.
- **Container `vector` reiniciando** (Docker Desktop no Windows): é o coletor
  de logs e não afeta nada. Para subir sem ele:
  `npm run backend:iniciar -- -x vector`.
- **Funções novas não aparecem:** depois de mudar o `config.toml`, rode
  `npm run backend:parar` e `npm run backend:iniciar`.
