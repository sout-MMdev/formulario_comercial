# 🧠 @cativa/nucleo

As **regras de negócio** do Formulário Comercial em TypeScript puro: sem React,
sem CSS, sem DOM de aplicação. É usado por **três** consumidores:

- `apps/desktop` e `apps/mobile` (as telas);
- as Edge Functions em `backend/`, que importam as mesmas regras para validar
  e recalcular no servidor (via `functions/_compartilhado/nucleo.ts`).

## Pastas (`src/`)

| Pasta | O que tem |
|---|---|
| `regras/` | Reembolso (km × tarifa, classificação de despesas, fechamento do dia), validações, fluxo das etapas, termômetro de estresse |
| `servicos/envio/` | Envio do relatório: real (`envioApi`) ou simulado (`envioMock`); `finalizarDia` e `situacaoEnvio` decidem o que a tela mostra |
| `servicos/armazenamento/` | Histórico local ("Dias salvos") no `localStorage` |
| `servicos/` | Executivos, agências, IBGE (municípios) e ViaCEP (endereços) |
| `estado/` | `formularioReducer`: todas as mudanças de dado do formulário |
| `config/` | Tarifas, setores, executivos e agências fictícios, URLs e chave do back-end |
| `tipos/` | Os formatos dos dados (`DiaSalvo`, `Trajeto`, `Despesa`…) |
| `utils/` | Formatadores de moeda, datas e local; geração de ids |

## Testes

```bash
npm test     # na raiz: núcleo + testes de unidade do back-end
```

Os testes ficam ao lado do código (`*.teste.ts`) e rodam no Node puro
(`node --test`), sem bundler.

## Regra da casa

- **Nada de React** em nenhuma pasta: componente pertence a um app.
- `regras/`, `estado/`, `tipos/`, `config/` e `utils/` **não usam APIs do
  navegador** (`window`, `document`, `localStorage`): é o que permite ao
  servidor importar essas regras.
- `servicos/` pode usar APIs web padrão (`fetch`, `localStorage`), porque só os
  apps os usam.
