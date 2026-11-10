// ================================================================
// POST /functions/v1/receber-formulario
// Recebe o dia salvo no app (DiaSalvo), grava no banco e manda a
// cópia por e-mail. Resposta: { enviadoAoCrm, emailEnviado,
// emailDestino } ou { erro }.
// O passo a passo está em _compartilhado/processar.ts.
// ================================================================

import { criarTratador, lerCorpoJson, responderJson } from "../_compartilhado/http.ts";
import { processarRelatorio } from "../_compartilhado/processar.ts";
import { chavesPublicasAceitas, dependenciasReais } from "../_compartilhado/servidor.ts";

Deno.serve(
  criarTratador({
    metodo: "POST",
    chavesAceitas: chavesPublicasAceitas,
    async tratar(req) {
      const leitura = await lerCorpoJson(req);
      if (!leitura.ok) return leitura.resposta;

      const { status, corpo } = await processarRelatorio(leitura.corpo, dependenciasReais());
      return responderJson(status, corpo);
    },
  }),
);
