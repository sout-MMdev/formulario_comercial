// ================================================================
// ARMAZENAMENTO — escolha da implementação.
//
// Para migrar do localStorage para o backend do CRM, basta criar
// `repositorioApi.ts` implementando RepositorioDias e trocar a
// atribuição abaixo. Nenhum outro arquivo do projeto muda.
// ================================================================

import { repositorioLocal } from "./repositorioLocal.ts";
import type { RepositorioDias } from "./repositorioDias.ts";

export const repositorioDias: RepositorioDias = repositorioLocal;

export type { RepositorioDias };
