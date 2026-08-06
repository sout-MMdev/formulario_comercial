// ================================================================
// ENVIO — escolha da implementação.
//
// Para ligar ao backend do CRM, crie `envioApi.ts` implementando
// ServicoEnvioRelatorio (com fetch) e troque a atribuição abaixo.
// Nenhum outro arquivo do projeto muda.
// ================================================================

import { envioMock } from "./envioMock.ts";
import type { ServicoEnvioRelatorio } from "./servicoEnvio.ts";

export const servicoEnvio: ServicoEnvioRelatorio = envioMock;

export type { ServicoEnvioRelatorio, ResultadoEnvio } from "./servicoEnvio.ts";
