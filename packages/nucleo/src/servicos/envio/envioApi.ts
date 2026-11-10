// ================================================================
// ENVIO — IMPLEMENTAÇÃO REAL (back end)
// Manda o relatório do dia para a Edge Function `receber-formulario`,
// que valida, recalcula, grava no banco e dispara a cópia por e-mail.
// Usada quando há back end configurado; senão, entra o envioMock.
// ================================================================

import type { DiaSalvo } from "../../tipos/index.ts";
import type { ResultadoEnvio, ServicoEnvioRelatorio } from "./servicoEnvio.ts";
import { MOTIVO_FALHA_PADRAO } from "./situacaoEnvio.ts";
import { URL_RECEBER_FORMULARIO, SUPABASE_ANON } from "../../config/index.ts";

/** Falha de rede: o navegador nem chegou a falar com o servidor. */
export const MOTIVO_SEM_CONEXAO =
  "Não foi possível conectar ao servidor. Confira sua internet e tente de novo.";

/** Status 200, mas sem a confirmação de que o relatório foi aceito. */
export const MOTIVO_RESPOSTA_INESPERADA =
  "O servidor respondeu de um jeito inesperado. Tente de novo.";

type RespostaServidor = Partial<ResultadoEnvio> & { erro?: string };

export const envioApi: ServicoEnvioRelatorio = {
  async enviar(dia: DiaSalvo): Promise<ResultadoEnvio> {
    const emailDestino = dia.identificacao?.email ?? "";

    let resposta: Response;
    try {
      resposta = await fetch(URL_RECEBER_FORMULARIO, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dia),
      });
    } catch (erro) {
      // O detalhe técnico fica no console; a tela recebe uma frase clara.
      console.error("Falha de rede ao enviar o relatório:", erro);
      return { enviadoAoCrm: false, emailEnviado: false, emailDestino, erro: MOTIVO_SEM_CONEXAO };
    }

    // Um erro do servidor pode vir sem JSON (ex.: página HTML de 502).
    const dados: RespostaServidor = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return {
        enviadoAoCrm: false,
        emailEnviado: false,
        emailDestino,
        erro: dados.erro?.trim() || MOTIVO_FALHA_PADRAO,
      };
    }

    // Só conta como aceito com a confirmação explícita do servidor.
    if (dados.enviadoAoCrm !== true) {
      return {
        enviadoAoCrm: false,
        emailEnviado: false,
        emailDestino,
        erro: MOTIVO_RESPOSTA_INESPERADA,
      };
    }

    return {
      enviadoAoCrm: true,
      emailEnviado: dados.emailEnviado === true,
      emailDestino: dados.emailDestino ?? emailDestino,
    };
  },
};
