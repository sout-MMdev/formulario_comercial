# 💼 Formulário Comercial — Gestão de Visitas & Despesas (Desktop & Mobile PWA)

<div align="center">

  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
  ![Testes](https://img.shields.io/badge/Testes-64%2F64%20Passando%20%E2%9C%85-brightgreen?style=for-the-badge)
  ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

  <br>

  <p align="center">
    <strong>Solução corporativa desenvolvida para substituir processos manuais em planilhas por uma plataforma ágil, responsiva e com cálculo financeiro automatizado em TypeScript puro.</strong>
  </p>

  <p align="center">
    <a href="#-o-desafio-de-negócio-do-excel-ao-app">O Desafio de Negócio</a> •
    <a href="#-guia-rápido-para-avaliadores--recrutadores">Guia para Avaliadores</a> •
    <a href="#-arquitetura-monorepo">Arquitetura</a> •
    <a href="#-desktop--mobile-pwa">Desktop × Mobile</a> •
    <a href="#-regras-de-negócio--testes">Regras & Testes</a> •
    <a href="#-como-executar">Como Executar</a> •
    <a href="#-autor">Autor</a>
  </p>

</div>

---

## 🎯 O Desafio de Negócio: Do Excel ao App

Historicamente, as equipes comerciais externas e a gestão utilizavam **planilhas manuais de Excel** para registrar os atendimentos às agências parceiras, controlar os quilômetros rodados e prestar contas dos gastos de viagem (combustível, refeições e hospedagens).

### Os Problemas da Operação Manual:
* ❌ **Fórmulas Quebradas & Erros de Cálculo:** A tarifa por quilômetro rodado variava conforme o executivo, gerando frequentes divergências manuais nos fechamentos de reembolso.
* ❌ **Comprovantes Perdidos:** Recibos fiscais se perdiam no trânsito antes de chegar ao departamento financeiro.
* ❌ **Falta de Dados Estruturados:** A gestão não conseguia monitorar em tempo real o nível de estresse ou insatisfação das agências visitadas.
* ❌ **Processo Lento e Descentralizado:** Preenchimentos demorados no fim do expediente geravam atrasos no pagamento de reembolsos.

### A Solução Implementada:
Desenvolvi este sistema com **dois aplicativos desacoplados** (Desktop e Mobile PWA) integrados a um **motor de domínio compartilhado em TypeScript puro**. O sistema automatiza regras financeiras rigorosas, calcula instantaneamente os valores a reembolsar, exige anexos apenas para compras no cartão pessoal, salva rascunhos offline no dispositivo e centraliza a ocorrência de relacionamento das agências.

---

## 🚀 Guia Rápido para Avaliadores & Recrutadores

Você pode clonar e rodar o projeto **imediatamente na sua máquina sem precisar criar banco de dados ou configurar chaves**.

O sistema conta com um **Modo Demonstração (Mock Seguro)** nativo: na ausência de variáveis de ambiente de produção, ele aciona automaticamente fallbacks fictícios conformes com a LGPD:

1. **Instale e rode em 2 comandos:**
   ```bash
   npm install
   npm run dev:desktop   # Abre em http://localhost:5501
   ```
2. **Cenários prontos para testar no Desktop:**
   * **Tarifas Dinâmicas de KM:** Selecione diferentes executivos (ex: *Diego Martins* possui tarifa diferenciada de R$ 1,43/km vs. *Paulo Souza* com R$ 1,30/km padrão). Veja o reembolso atualizar no resumo ao vivo.
   * **Classificação de Despesas:** Lance um gasto no **Cartão Pessoal** (o sistema exige upload de comprovante e soma no reembolso) vs. **Cartão Clara/Corporativo** com combustível (o sistema desconta automaticamente do reembolso final).
   * **Termômetro de Relacionamento:** Marque o estresse da agência como *Alto* ou *Crítico* e veja a validação exigir a descrição do problema e os setores acionados.
   * **Persistência Local:** Salve o dia e feche o navegador. Ao reabrir, os dados continuam disponíveis no histórico de rascunhos (`localStorage`).
3. **Cenários para testar no Mobile PWA (`npm run dev:mobile` - porta 5502):**
   * Interface mobile first com alvos de toque de 56px e teclado numérico adaptado.
   * **Tela de Login:** Acesse `http://localhost:5502/?login` para visualizar a experiência de login mobile moderno com efeito de vidro (*glassmorphism*).

---

## 🏛️ Arquitetura Monorepo

O projeto adota uma arquitetura modular baseada em **npm workspaces**, desacoplando totalmente a regra de negócio da camada de apresentação:

```
formulario/
├── packages/
│   ├── nucleo/          ← MOTOR DE DOMÍNIO (TypeScript Puro - DDD)
│   │   └── src/
│   │       ├── tipos/       Definições de domínio e tipagem estrita
│   │       ├── config/      Executivos, tarifas, produtos, setores e APIs
│   │       ├── regras/      Cálculo de reembolso, validação, fluxo e termômetro
│   │       ├── estado/      Reducer de estado compartilhado (usado por ambos os apps)
│   │       ├── servicos/    Integrações (IBGE, ViaCEP, agências, envio e storage)
│   │       └── utils/       Formatadores de moeda, datas e documentos
│   │
│   └── tema/            ← SISTEMA DE DESIGN (Tokens CSS compartilhados)
│       └── src/
│           ├── cores.css        Paleta institucional e papéis semânticos
│           ├── tipografia.css   Escala tipográfica padronizada (Inter)
│           ├── efeitos.css      Sombras institucionais, raios e transições
│           └── reset.css        Normalização e suporte a prefers-reduced-motion
│
└── apps/
    ├── desktop/         ← Interface para computador (Abas horizontais e Resumo ao Vivo)
    └── mobile/          ← Interface Mobile First PWA (Passo a passo com 100dvh e safe-areas)
```

### O que é compartilhado vs. específico:

| Recurso / Camada | Compartilhado? | Implementação |
| :--- | :---: | :--- |
| **Regras de Negócio e Cálculos Financeiros** | ✅ **Sim** | `@cativa/nucleo` (100% agnóstico de UI) |
| **Gerenciamento de Estado do Formulário** | ✅ **Sim** | `@cativa/nucleo/estado` (FormularioReducer) |
| **Design Tokens & Variáveis Visuais** | ✅ **Sim** | `@cativa/tema` (CSS moderno) |
| **Serviços de API e Storage Offline** | ✅ **Sim** | `@cativa/nucleo/servicos` |
| **Layout e Navegação** | ❌ **Específico** | Desktop (Abas) × Mobile (Passos) |
| **Ergonomia de Entrada (Mouse vs. Touch)** | ❌ **Específico** | Otimizado para o fator de forma de cada dispositivo |

---

## 📱 Desktop × Mobile PWA

A versão mobile não é apenas o desktop reduzido; ela foi construída seguindo diretrizes rigorosas de ergonomia móvel:

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
| **Tamanho da Fonte** | 15px | **16px** (evita zoom indesejado no iOS Safari) |
| **Botões de Ação** | Rodapé do painel | **Barra fixa inferior** na zona de conforto |
| **Comprovantes** | Upload de arquivo | **Câmera direta** ou galeria de fotos |
| **Área Visível** | `100vh` | `100dvh` + suporte a *safe areas* do iPhone |

---

## 🧪 Regras de Negócio & Testes Automatizados

O motor central conta com **64 testes unitários** automatizados rodando nativamente no Node.js via TypeScript puro:

```bash
npm test
```

```text
▶ etapas visíveis (5.4ms)
▶ etapa inicial de cada relatório (1.0ms)
▶ relatórios que faltam (1.5ms)
▶ estado de cada etapa na trilha (3.0ms)
▶ tarifa por quilômetro (5.3ms)
▶ reembolso de quilometragem (1.2ms)
▶ classificação da despesa (1.8ms)
▶ fechamento do dia (2.2ms)
▶ e-mail (2.4ms)
▶ identificação (2.3ms)
▶ visita (1.8ms)
▶ despesas (2.8ms)
▶ salvar o dia (0.6ms)
▶ registro do termômetro (1.1ms)
▶ envio do relatório para o back end (35.5ms)
▶ finalizar o dia (5.7ms)
▶ situação do envio do relatório (7.1ms)
▶ limpar o texto do local (2.4ms)

ℹ tests 64
ℹ suites 18
ℹ pass 64
ℹ fail 0
ℹ duration_ms 284ms
```

Os testes de envio garantem que a tela de "Relatório enviado" só aparece quando o envio foi aceito, e que uma falha mostra um motivo claro em vez de um erro técnico.

### Regras Principais Validadas nos Testes:
* **Fórmula de Fechamento do Dia:**
  $$\text{Total a Reembolsar} = \text{Reembolso KM} + \text{Cartão Pessoal} - \text{Abastecimento Cartão Clara}$$
* **Obrigatoriedade de Comprovantes:** Exigência de nota fiscal anexada para despesas em cartão pessoal; dispensa de comprovante para cartão corporativo pré-aprovado.
* **Gatilho de Ocorrência:** Obrigatoriedade de detalhamento técnico para níveis de estresse Médio, Alto e Crítico.

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

### 2. Executar Verificação e Testes
```bash
# Validar tipagem estrita em todos os pacotes
npm run typecheck

# Executar a suíte de testes unitários
npm test
```

### 3. Iniciar as Aplicações

```bash
# Iniciar a aplicação Desktop (Abre em http://localhost:5501)
npm run dev:desktop

# Iniciar a aplicação Mobile PWA (Abre em http://localhost:5502)
npm run dev:mobile
```

---

## 👨‍💻 Autor

Desenvolvido por **Maxuel Monteiro (sout-MMdev)**.

[![GitHub](https://img.shields.io/badge/GitHub-sout--MMdev-181717?style=flat&logo=github&logoColor=white)](https://github.com/sout-MMdev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Maxuel%20Monteiro-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/maxuel-monteiro/)
