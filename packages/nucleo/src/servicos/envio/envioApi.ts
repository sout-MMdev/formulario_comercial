// ================================================================
// ENVIO — IMPLEMENTAÇÃO REAL (back end)
// Manda o relatório do dia para a Edge Function `receber-formulario`,
// que grava tudo no CRM (schema app) e dispara a cópia por e-mail.
// Usada quando há back end configurado; senão, entra o envioMock.
// ================================================================

import type { DiaSalvo } from "../../tipos/index.ts";
import type { ResultadoEnvio, ServicoEnvioRelatorio } from "./servicoEnvio.ts";
import { URL_RECEBER_FORMULARIO, SUPABASE_ANON } from "../../config/index.ts";

export const envioApi: ServicoEnvioRelatorio = {
  async enviar(dia: DiaSalvo): Promise<ResultadoEnvio> {
    const emailDestino = dia.identificacao?.email ?? "";

    try {
      const resposta = await fetch(URL_RECEBER_FORMULARIO, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dia),
      });

      const dados = (await resposta.json()) as Partial<ResultadoEnvio> & {
        erro?: string;
      };

      if (!resposta.ok) {
        return {
          enviadoAoCrm: false,
          emailEnviado: false,
          emailDestino,
          erro: dados?.erro ?? "Falha ao enviar o relatório.",
        };
      }

      return {
        enviadoAoCrm: dados.enviadoAoCrm ?? true,
        emailEnviado: dados.emailEnviado ?? false,
        emailDestino: dados.emailDestino ?? emailDestino,
      };
    } catch (erro) {
      return {
        enviadoAoCrm: false,
        emailEnviado: false,
        emailDestino,
        erro: String(erro),
      };
    }
  },
};
