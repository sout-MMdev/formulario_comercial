// ================================================================
// ABAS — as etapas do formulário.
//
// Para acrescentar uma aba nova:
//   1. adicione o nome em NomeEtapa (nucleo/tipos);
//   2. inclua-a no fluxo desejado (nucleo/config/fluxo.ts);
//   3. crie a pasta src/abas/<Aba>/ com .tsx + .css;
//   4. registre-a no mapa de src/App.tsx.
// ================================================================

export { Agencias } from "./Agencias";
export { Despesas } from "./Despesas";
export { Identificacao } from "./Identificacao";
export { Resumo } from "./Resumo";
export { Visita } from "./Visita";
