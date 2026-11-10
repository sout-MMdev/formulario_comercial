// ================================================================
// GET /functions/v1/listar-executivos
// Executivos ativos para o seletor da aba Identificação.
// Resposta: [{ nome, email }] em ordem alfabética.
// ================================================================

import { criarTratador, responderJson } from "../_compartilhado/http.ts";
import { chavesPublicasAceitas, criarClienteServico } from "../_compartilhado/servidor.ts";

Deno.serve(
  criarTratador({
    metodo: "GET",
    chavesAceitas: chavesPublicasAceitas,
    async tratar() {
      const { data, error } = await criarClienteServico()
        .from("executivos")
        .select("nome, email")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return responderJson(200, data);
    },
  }),
);
