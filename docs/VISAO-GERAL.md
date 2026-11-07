# Visão Geral do Sistema — Gestão Comercial

Documentação de arquitetura de alto nível do ecossistema do **Formulário Comercial**.
Para detalhes específicos da aplicação e de suas regras, consulte [FORMULARIO.md](FORMULARIO.md).

---

## 1. O que é

Uma solução corporativa composta por **dois front-ends independentes** (Desktop e Mobile PWA) que compartilham um **núcleo comum de regras de negócio em TypeScript** (`@cativa/nucleo`) e integram-se com o backend Supabase:

| Projeto | O que faz | Quem usa |
|---|---|---|
| **Formulário Desktop** (`apps/desktop`) | Registro em escritório: visitas a agências, termômetro de estresse, despesas e KM | Executivos de conta e assistentes |
| **Formulário Mobile PWA** (`apps/mobile`) | Registro em campo via smartphone com interface tátil e offline-first | Executivos de conta em trânsito |
| **Núcleo Compartilhado** (`packages/nucleo`) | Motor central: regras de cálculo, validações, estado e integrações | Consumido por ambos os frontends |
| **Backend** (Supabase) | Banco PostgreSQL + RLS + Storage de comprovantes + Edge Functions | Serve com segurança as aplicações |

---

## 2. Arquitetura de Comunicação e Segurança

```
   FORMULÁRIO (Desktop / Mobile PWA)
   Autônomo com fallback offline e chave pública (anon)
         │
         │  Edge Functions públicas com rate-limiting
         │  (listar-agencias, listar-executivos, receber-formulario)
         ▼
   ┌──────────────────────────────────────────────────────┐
   │                   SUPABASE                            │
   │  Postgres (Schema app com RLS) · Storage · Deno      │
   └──────────────────────────────────────────────────────┘
```

- **Privacidade e LGPD:** O formulário público no cliente nunca baixa a tabela inteira de agências nem expõe dados sensíveis como faturamento ou comissões. As Edge Functions devolvem apenas o necessário para autocompletion.
- **Segurança de Dados:** O RLS (Row Level Security) garante que cada usuário opere estritamente dentro da sua carteira autorizada.
- **Fallback para Demonstração:** Sem variáveis de ambiente configuradas, os serviços chaveiam automaticamente para um repositório local (`localStorage`) e dados mockados, permitindo testes sem dependências externas.

---

## 3. Stack Tecnológica

- **Front-end:** React + TypeScript + Vite.
- **PWA:** Vite Plugin PWA com Service Workers (Workbox) e suporte a instalação offline.
- **Arquitetura:** Monorepo com npm workspaces e Domain-Driven Design (DDD).
- **Estilos:** CSS modular moderno com `@layer` (tema, root, base, compartilhado).
- **Back-end:** Supabase — PostgreSQL, RLS, Storage e Edge Functions em Deno.

---

## 4. Estrutura do Repositório

```
formulario_comercial/
├── apps/
│   ├── desktop/                 # Interface Desktop (Abas horizontais e resumo ao vivo)
│   └── mobile/                  # Interface Mobile PWA (Passo a passo otimizado para toque)
├── packages/
│   ├── nucleo/                  # Lógica pura de domínio, regras de reembolso e testes
│   └── tema/                    # Tokens de design e identidade visual compartilhados
├── backend/                     # Documentação de integração, scripts e variáveis de ambiente
└── docs/                        # Documentação técnica e funcional
```

---

## 5. Como Executar

```bash
# 1. Instalar as dependências do monorepo
npm install

# 2. Rodar a suíte de testes unitários do núcleo
npm test

# 3. Executar o app Desktop (porta 5501)
npm run dev:desktop

# 4. Executar o app Mobile PWA (porta 5502)
npm run dev:mobile
```
