// ================================================================
// TESTES — ENVIO PARA O BACK END
// O motivo de uma falha vai direto para a tela do executivo. Por
// isso ele precisa ser uma frase em português, nunca um erro
// técnico do navegador como "TypeError: Failed to fetch".
//
// Rodar:  npm test
// ================================================================

import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import type { DiaSalvo } from "../../tipos/index.ts";
import { envioApi } from "./envioApi.ts";

const DIA: DiaSalvo = {
  id: 1,
  salvadoEm: "10/11/2026 10:00",
  fluxos: ["despesas"],
  identificacao: { nome: "ANA TESTE", email: "ana@empresa.exemplo" },
  visita: { data: "", agencias: [] },
  agenciasVisitadas: [],
  agenciasComercial: [],
  trajetos: [],
  despesas: [],
};

afterEach(() => mock.restoreAll());

describe("envio do relatório para o back end", () => {
  it("sem conexão: devolve uma frase clara, sem o erro técnico", async () => {
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("Failed to fetch");
    });
    mock.method(console, "error", () => {});

    const resultado = await envioApi.enviar(DIA);

    assert.equal(resultado.enviadoAoCrm, false);
    assert.equal(
      resultado.erro,
      "Não foi possível conectar ao servidor. Confira sua internet e tente de novo.",
    );
  });

  it("erro do servidor sem JSON (ex.: 502): usa o texto padrão", async () => {
    mock.method(globalThis, "fetch", async () => new Response("<html>erro</html>", { status: 502 }));

    const resultado = await envioApi.enviar(DIA);

    assert.equal(resultado.enviadoAoCrm, false);
    assert.equal(resultado.erro, "Não foi possível enviar o relatório.");
  });

  it("resposta 200 sem a confirmação esperada: não conta como enviado", async () => {
    mock.method(globalThis, "fetch", async () => Response.json({}, { status: 200 }));

    const resultado = await envioApi.enviar(DIA);

    assert.equal(resultado.enviadoAoCrm, false);
    assert.equal(resultado.erro, "O servidor respondeu de um jeito inesperado. Tente de novo.");
  });

  it("erro do servidor com mensagem: repassa a mensagem do servidor", async () => {
    mock.method(globalThis, "fetch", async () =>
      Response.json({ erro: "Executivo não encontrado ou inativo." }, { status: 422 }),
    );

    const resultado = await envioApi.enviar(DIA);

    assert.equal(resultado.enviadoAoCrm, false);
    assert.equal(resultado.erro, "Executivo não encontrado ou inativo.");
  });
});
