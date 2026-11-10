// ================================================================
// SITUAÇÃO DO ENVIO
// Traduz o resultado técnico do envio no que a tela deve dizer.
// Regra: só há "Relatório enviado" quando o CRM aceitou o relatório.
// Os dois apps (desktop e mobile) usam esta mesma decisão.
// ================================================================

import type { ResultadoEnvio } from "./servicoEnvio.ts";

/** O que aconteceu com a cópia por e-mail de um relatório aceito. */
export type SituacaoCopia = "enviada" | "sem-email" | "falhou";

export type SituacaoEnvio =
  | { tipo: "enviado"; copia: SituacaoCopia; emailDestino: string }
  | { tipo: "falhou"; motivo: string };

/** Texto usado quando a falha não trouxe motivo. */
export const MOTIVO_FALHA_PADRAO = "Não foi possível enviar o relatório.";

export function classificarEnvio(resultado: ResultadoEnvio): SituacaoEnvio {
  if (!resultado.enviadoAoCrm) {
    return { tipo: "falhou", motivo: resultado.erro?.trim() || MOTIVO_FALHA_PADRAO };
  }

  const emailDestino = resultado.emailDestino.trim();
  const copia: SituacaoCopia = resultado.emailEnviado
    ? "enviada"
    : emailDestino
      ? "falhou"
      : "sem-email";

  return { tipo: "enviado", copia, emailDestino };
}
