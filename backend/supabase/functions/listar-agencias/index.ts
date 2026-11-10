// ================================================================
// GET /functions/v1/listar-agencias
// Nomes das agências para o autocomplete da aba Visita.
// Resposta: ["Turismo Aurora", ...] em ordem alfabética.
// ================================================================

import { criarTratador, responderJson } from "../_compartilhado/http.ts";
import { chavesPublicasAceitas, criarClienteServico } from "../_compartilhado/servidor.ts";

Deno.serve(
  criarTratador({
    metodo: "GET",
    chavesAceitas: chavesPublicasAceitas,
    async tratar() {
      const { data, error } = await criarClienteServico()
        .from("agencias")
        .select("nome")
        .order("nome");
      if (error) throw error;
      return responderJson(200, data.map((agencia: { nome: string }) => agencia.nome));
    },
  }),
);
