// ================================================================
// PORTA PARA O NÚCLEO
// A ÚNICA entrada das Edge Functions nas regras do front
// (packages/nucleo). Front e servidor calculam e validam com o mesmo
// código: mudou a regra lá, o servidor acompanha sem cópia.
//
// O Supabase CLI empacota estes imports relativos junto com a função
// (conferido na sondagem do ambiente).
// ================================================================

export * from "../../../../packages/nucleo/src/regras/index.ts";
export * from "../../../../packages/nucleo/src/utils/index.ts";
export { categoriasDespesa } from "../../../../packages/nucleo/src/config/despesas.ts";
export type * from "../../../../packages/nucleo/src/tipos/index.ts";
export type { ResultadoEnvio } from "../../../../packages/nucleo/src/servicos/envio/servicoEnvio.ts";
