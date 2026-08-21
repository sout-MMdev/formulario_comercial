// ================================================================
// ENVIO — escolha da implementação.
//
// Com back end configurado (VITE_SUPABASE_*), usa a implementação REAL
// (envioApi → Edge Function receber-formulario, que grava no CRM e
// manda a cópia por e-mail). Sem back end, cai no mock (simula o envio).
// Nenhum componente do formulário muda: os dois cumprem a mesma interface.
// ================================================================

import { envioMock } from "./envioMock.ts";
import { envioApi } from "./envioApi.ts";
import { TEM_BACKEND } from "../../config/index.ts";
import type { ServicoEnvioRelatorio } from "./servicoEnvio.ts";

export const servicoEnvio: ServicoEnvioRelatorio = TEM_BACKEND
  ? envioApi
  : envioMock;

export type { ServicoEnvioRelatorio, ResultadoEnvio } from "./servicoEnvio.ts";
