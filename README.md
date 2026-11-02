# 💼 Formulário Comercial — Gestão de Visitas & Despesas (Desktop & Mobile PWA)

<div align="center">

  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
  ![Testes](https://img.shields.io/badge/Testes-49%2F49%20Passando%20%E2%9C%85-brightgreen?style=for-the-badge)
  ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

  <br>

  <p align="center">
    <strong>Sistema comercial corporativo desenvolvido com foco em alta produtividade, unindo programação moderna em TypeScript e engenharia assistida por Inteligência Artificial.</strong>
  </p>

  <p align="center">
    <a href="#-visão-geral">Visão Geral</a> •
    <a href="#-arquitetura-monorepo">Arquitetura</a> •
    <a href="#-desktop--mobile-pwa">Desktop × Mobile</a> •
    <a href="#-regras-de-negócio--testes">Regras & Testes</a> •
    <a href="#-como-executar">Como Executar</a> •
    <a href="#-desenvolvimento-com-ia">Desenvolvimento com IA</a> •
    <a href="#-autor">Autor</a>
  </p>

</div>

---

## 📌 Visão Geral

O **Formulário Comercial** é uma solução completa para equipes comerciais externas realizarem o registro ágil de visitas técnicas, ocorrências de relacionamento com agências parceiras, trajetos percorridos e prestação de contas de despesas com cálculo automático de reembolso.

A solução foi projetada sob uma arquitetura de **dois aplicativos independentes** que compartilham exatamente o mesmo motor de regras de negócio:

| Aplicação | Público-Alvo | Dispositivo / Formato | Porta Padrão |
| :--- | :--- | :--- | :--- |
| **Desktop** (`@cativa/desktop`) | Preenchimento rápido em escritório | Computador / Telas largas (Navegação por Abas) | `5501` |
| **Mobile PWA** (`@cativa/mobile`) | Lançamento em campo pelos executivos | Celular / PWA instalável (Fluxo passo a passo) | `5502` |

Ambas as aplicações compartilham o pacote agnóstico **`@cativa/nucleo`**, garantindo que as regras de reembolso, validações e fluxos de dados sejam idênticos em qualquer dispositivo.

---

## 🏛️ Arquitetura Monorepo

O projeto adota uma arquitetura modular baseada em **npm workspaces**, desacoplando a regra de negócio da camada de apresentação:

```
formulario/
├── packages/
│   ├── nucleo/          ← O MOTOR CENTRAL (Lógica pura em TypeScript)
│   │   └── src/
│   │       ├── tipos/       Definições de domínio e tipagem estrita
│   │       ├── config/      Executivos, tarifas, produtos, setores (com dados fictícios de demonstração)
│   │       ├── regras/      Cálculo de reembolso, validação, fluxo e termômetro
│   │       ├── estado/      Reducer de estado compartilhado (usado por ambos os apps)
│   │       ├── servicos/    Integrações (IBGE, ViaCEP, agências, persistência local)
│   │       └── utils/       Formatadores de moeda, datas e documentos
│   │
│   └── tema/            ← SISTEMA DE DESIGN (CSS puro + SVGs)
│       ├── cores.css        Paleta de cores e variáveis semânticas
│       ├── tipografia.css   Escala tipográfica padronizada
│       ├── efeitos.css      Sombras, raios de borda e transições
│       └── icones.ts        Ícones em traçados SVG reutilizáveis
│
└── apps/
    ├── desktop/         ← Interface focada em tela cheia (Abas e painéis lado a lado)
    └── mobile/          ← Interface Mobile First (PWA, passos guiados e alvos de toque)
```

### O que é compartilhado vs. específico:

| Recurso / Camada | Compartilhado? | Implementação |
| :--- | :---: | :--- |
| **Regras de Negócio e Cálculos** | ✅ **Sim** | `@cativa/nucleo` (100% reutilizável) |
| **Gerenciamento de Estado do Formulário** | ✅ **Sim** | `@cativa/nucleo/estado` (Reducer) |
| **Serviços de API e Storage** | ✅ **Sim** | `@cativa/nucleo/servicos` |
| **Estilos, Cores e Ícones** | ✅ **Sim** | `@cativa/tema` |
| **Layout e Navegação** | ❌ **Específico** | Desktop (Abas) × Mobile (Passos) |
| **Experiência de Input (Touch vs. Mouse)** | ❌ **Específico** | Otimizado para cada fator de forma |

---

## 📱 Desktop × Mobile PWA

A versão mobile não é apenas o desktop reduzido; ela foi concebida seguindo rigorosas diretrizes de ergonomia móvel:

```
Fluxo Mobile:
1. Quem está preenchendo? ➔ 2. O que vai registrar?
                                  ├── Visita:   3. Data ➔ 4. Agências ➔ 5. Análise de Relacionamento
                                  └── Despesas: 3. Trajetos ➔ 4. Gastos
                                                                 ↓
                                                             Resumo Final
```

| Aspecto | Versão Desktop | Versão Mobile (PWA) |
| :--- | :--- | :--- |
| **Navegação** | Abas horizontais com trilha lateral | Passo a passo com barra de progresso |
| **Densidade** | 2 a 3 campos por linha | Um assunto por tela |
| **Altura dos Campos** | 46px | **56px** (área de toque ideal no polegar) |
| **Tamanho da Fonte** | 15px | **16px** (evita zoom automático no iOS) |
| **Botões de Ação** | Rodapé do painel | **Barra fixa inferior** na zona de conforto |
| **Comprovantes** | Upload de arquivo | **Tirar foto direto da câmera** ou galeria |
| **Área Visível** | `100vh` | `100dvh` + suporte a *safe areas* do iPhone |

---

## 🧪 Regras de Negócio & Testes Automatizados

O sistema conta com **49 testes unitários** automatizados rodando nativamente com `node --test` e TypeScript, cobrindo todos os cenários críticos:

```bash
npm test
```

```text
▶ etapas visíveis (5.1ms)
▶ tarifa por quilômetro (6.4ms)
▶ reembolso de quilometragem (2.3ms)
▶ classificação da despesa (2.7ms)
▶ fechamento do dia (5.8ms)
▶ identificação (1.0ms)
▶ visita (1.9ms)
▶ despesas e comprovantes (1.5ms)
▶ registro do termômetro de estresse (0.4ms)

ℹ tests 49
ℹ suites 14
ℹ pass 49
ℹ fail 0
ℹ duration_ms 361ms
```

### Regras Principais Validadas nos Testes:
* **Cálculo de Reembolso por KM:** Multiplicação precisa da quilometragem pela tarifa configurada, com suporte a tarifas personalizadas por executivo.
* **Fechamento Financeiro do Dia:**
  $$\text{Total a Reembolsar} = \text{Reembolso KM} + \text{Cartão Pessoal} - \text{Abastecimentos no Cartão Corporativo}$$
* **Obrigatoriedade de Comprovantes:** Exigência de anexo para gastos em cartão pessoal e dispensa para cartão corporativo pré-aprovado.
* **Termômetro de Relacionamento:** Abertura de ocorrência obrigatória para níveis de estresse Médio, Alto e Crítico.

---

## ⚙️ Como Executar

### Pré-requisitos
* [Node.js](https://nodejs.org/) versão **20.x** ou superior.
* Gerenciador de pacotes `npm`.

### 1. Clonar e Instalar
```bash
git clone https://github.com/sout-MMdev/formulario_comercial.git
cd formulario_comercial
npm install
```

### 2. Iniciar os Aplicativos

Você pode rodar os dois aplicativos simultaneamente em abas separadas do terminal:

```bash
# Iniciar a aplicação Desktop (Abre em http://localhost:5501)
npm run dev:desktop

# Iniciar a aplicação Mobile (Abre em http://localhost:5502)
npm run dev:mobile
```

### 3. Testar no Celular (Rede Local Wi-Fi)
Ao executar `npm run dev:mobile`, o Vite disponibiliza um endereço na rede local (ex: `http://192.168.1.X:5502`).
1. Conecte o celular na mesma rede Wi-Fi do computador.
2. Acesse o endereço no navegador do celular.
3. **No Android (Chrome):** Toque em **⋮ → Instalar aplicativo**.
4. **No iOS (Safari):** Toque em **Compartilhar → Adicionar à Tela de Início**.

---

## 🤖 Desenvolvimento com IA & Boas Práticas

Este projeto foi construído combinando **fundamentos sólidos de desenvolvimento Full Stack** com o uso estratégico de **agentes de Inteligência Artificial**, explorando o que há de mais moderno na produtividade do desenvolvedor:

* **Arquitetura Orientada a Domínio (DDD):** Isolamento de toda regra de negócio pura em `@cativa/nucleo`, permitindo que o mesmo código rode no browser e no Node.js.
* **Engenharia de Testes Assistida por IA:** Cobertura de casos de borda (arredondamento financeiro, campos vazios, fluxo de navegação) estruturados com agilidade.
* **Segurança e Conformidade (LGPD):** Separação estrita entre dados de demonstração (mock) e infraestrutura de produção, garantindo que nenhum dado sensível ou chave de API seja exposta.

---

## 👨‍💻 Autor

Desenvolvido por **Maxuel (sout-MMdev)**.

[![GitHub](https://img.shields.io/badge/GitHub-sout--MMdev-181717?style=flat&logo=github&logoColor=white)](https://github.com/sout-MMdev)
