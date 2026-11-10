// ================================================================
// TESTES — UTILITÁRIOS HTTP (servidor)
// Toda resposta precisa dos cabeçalhos CORS (o navegador chama de
// outro domínio) e a chave pública do app é conferida pela própria
// função.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  chavePublicaValida,
  responderJson,
  responderPreflight,
} from "../../supabase/functions/_compartilhado/http.ts";

describe("respostas HTTP", () => {
  it("preflight responde 204 e libera o cabeçalho apikey", () => {
    const resposta = responderPreflight();
    assert.equal(resposta.status, 204);
    assert.match(resposta.headers.get("access-control-allow-headers") ?? "", /apikey/);
    assert.equal(resposta.headers.get("access-control-allow-origin"), "*");
  });

  it("resposta JSON leva status, content-type e CORS", async () => {
    const resposta = responderJson(400, { erro: "x" });
    assert.equal(resposta.status, 400);
    assert.equal(resposta.headers.get("content-type"), "application/json; charset=utf-8");
    assert.equal(resposta.headers.get("access-control-allow-origin"), "*");
    assert.deepEqual(await resposta.json(), { erro: "x" });
  });
});

describe("chave pública do app", () => {
  const pedido = (apikey?: string) =>
    new Request("http://localhost/funcao", { headers: apikey ? { apikey } : {} });

  it("aceita a chave da lista", () => {
    assert.equal(chavePublicaValida(pedido("chave-certa"), ["chave-certa"]), true);
  });

  it("recusa chave errada", () => {
    assert.equal(chavePublicaValida(pedido("outra"), ["chave-certa"]), false);
  });

  it("recusa pedido sem chave, mesmo se a lista tiver texto vazio", () => {
    assert.equal(chavePublicaValida(pedido(), ["chave-certa", ""]), false);
  });
});
