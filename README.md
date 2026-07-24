# Formulário Comercial — Cativa Operadora

Formulário web de **relatório comercial** para os executivos da Cativa Operadora.
Feito em TypeScript puro com Vite (sem framework).

## Funcionalidades

O executivo escolhe entre dois fluxos (pode preencher os dois no mesmo dia):

- **Visita** — registra as agências visitadas no dia, os dados comerciais de cada
  uma (fundação, faturamento, produtos, atendentes), o termômetro de estresse por
  setor e as ações acordadas.
- **Despesas** — registra os trajetos com cálculo automático de reembolso de KM e
  as despesas com comprovante.

Ao final, um resumo consolida tudo e o dia pode ser salvo (atualmente em
`localStorage`).

Recursos de apoio: autocomplete de cidades (API do IBGE), autocomplete de ruas
(ViaCEP), autocomplete de agências, seletor de data customizado e tela de splash
durante o carregamento das APIs.

## Como rodar

Requisitos: [Node.js](https://nodejs.org/) 18 ou superior.

```bash
# 1. Instalar as dependências
npm install

# 2. Subir o servidor de desenvolvimento
npm run dev
```

O navegador abre automaticamente em `http://localhost:5501`.

## Scripts disponíveis

| Comando           | O que faz                                          |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento com hot reload          |
| `npm run build`   | Verifica os tipos e gera a build de produção em `dist/` |
| `npm run preview` | Serve localmente a build de produção                |

## Estrutura do projeto

```
index.html            Página única com todas as etapas do formulário
public/               Arquivos estáticos servidos direto
  agencias.json         Base de agências usada no autocomplete
  splash.html           Markup da tela de carregamento
  assets/css/splash.css Estilos da tela de splash
  assets/img/           Imagens (logo)
src/
  main.ts             Ponto de entrada — inicializa e liga todos os módulos
  config/dados.ts     Constantes e regras (executivos, tarifas, listas, etapas)
  types/index.ts      Interfaces TypeScript de todos os dados
  utils/formatadores.ts  Funções puras (data, moeda, acentos, HTML)
  styles/             Estilos, importados por main.ts (empacotados pelo Vite)
    index.css           Índice — importa os demais na ordem correta
    base/               Variáveis, reset, tipografia e responsivo global
    layout/             Estrutura da página (cabeçalho, rodapé, etapas…)
    components/         Peças reutilizáveis (campos, botões, popups…)
    pages/              Telas específicas (resumo do dia)
  modules/
    splash.ts           Tela de carregamento inicial
    fluxo.ts            Navegação entre etapas e barra de progresso
    cidades.ts          Autocomplete de cidades (IBGE) e ruas (ViaCEP)
    agencias.ts         Autocomplete de agências
    data-picker.ts      Seletor de data customizado
    multiselect.ts      Componente de seleção múltipla
    despesas.ts         Blocos de trajeto/despesa e cálculo de KM
    agencia-analise.ts  Dados comerciais e termômetro por agência
    estresse.ts         Termômetro de estresse por setor
    resumo.ts           Resumo do dia e regras de reembolso
    storage.ts          Persistência (localStorage)
    scroll-reveal.ts    Animação de revelação ao rolar
```

## Observações

- A camada `storage.ts` isola toda a persistência, para facilitar a troca do
  `localStorage` por um backend no futuro.
- As tarifas de quilometragem e a lista de executivos ficam centralizadas em
  `src/config/dados.ts`.
