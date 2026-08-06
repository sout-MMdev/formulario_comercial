// ================================================================
// NÚCLEO — ponto único de importação.
//
// Nada aqui conhece React, DOM de aplicação ou CSS. É a camada que
// os dois apps (desktop e mobile) compartilham e que pode ser
// levada para um backend Node sem alteração.
//
// Prefira os subcaminhos quando quiser deixar claro de onde vem:
//   import { TARIFA_KM_PADRAO } from "@cativa/nucleo/config";
//   import { calcularTotaisDia } from "@cativa/nucleo/regras";
// ================================================================

export * from "./tipos/index.ts";
export * from "./config/index.ts";
export * from "./regras/index.ts";
export * from "./utils/index.ts";
export * from "./estado/index.ts";
