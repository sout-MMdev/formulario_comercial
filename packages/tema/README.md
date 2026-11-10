# 🎨 @cativa/tema

Pacote compartilhado de **tokens de design, paleta de cores, tipografia, efeitos e reset CSS** do ecossistema Comercial Cativa.

## Conteúdo
* `cores.css`: Paleta oficial Cativa (Azul escuro, Azul institucional, Amarelo destaque, neutros e papéis semânticos).
* `tipografia.css`: Escala tipográfica padronizada de `2xs` (11px) a `3xl` (40px).
* `efeitos.css`: Raios de borda (`--raio-*`), sombras com tom institucional e transições.
* `reset.css`: Normalização entre navegadores e suporte a `prefers-reduced-motion`.
* `index.css`: Ponto único de importação de todos os tokens.

## Como os apps usam
Os dois apps importam `@cativa/tema` (alias no `vite.config.ts` de cada um) na
camada `tema` do CSS (`src/estilos/`). Componentes usam **só as variáveis**
(`var(--cor-...)`, `var(--raio-...)`), nunca cores em HEX direto: mudar a
identidade visual é mudar este pacote.
