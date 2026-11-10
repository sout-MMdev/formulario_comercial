// ================================================================
// TESTES — UTILITÁRIOS HTTP (servidor)
// Toda resposta precisa dos cabeçalhos CORS (o navegador chama de
// outro domínio) e a chave pública do app é conferida pela própria
// função.
//
// Rodar:  npm test
// ================================================================

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  chavePublicaValida,
  criarTratador,
  lerCorpoJson,
  lerListaDeChaves,
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

describe("lista de chaves vinda do ambiente", () => {
  it("aceita objeto JSON { nome: chave }", () => {
    assert.deepEqual(lerListaDeChaves('{"default":"k1","outra":"k2"}'), ["k1", "k2"]);
  });

  it("aceita lista JSON e texto simples", () => {
    assert.deepEqual(lerListaDeChaves('["k1","k2"]'), ["k1", "k2"]);
    assert.deepEqual(lerListaDeChaves("k1"), ["k1"]);
  });

  it("ausente ou vazio vira lista vazia", () => {
    assert.deepEqual(lerListaDeChaves(undefined), []);
    assert.deepEqual(lerListaDeChaves(""), []);
  });
});

describe("leitura do corpo JSON", () => {
  const post = (corpo: string) => new Request("http://localhost/f", { method: "POST", body: corpo });

  it("devolve o objeto quando o JSON é válido", async () => {
    const leitura = await lerCorpoJson(post('{"a":1}'));
    assert.deepEqual(leitura, { ok: true, corpo: { a: 1 } });
  });

  it("JSON inválido responde 400 com mensagem clara", async () => {
    const leitura = await lerCorpoJson(post("{oi"));
    assert.equal(leitura.ok, false);
    if (!leitura.ok) {
      assert.equal(leitura.resposta.status, 400);
      assert.deepEqual(await leitura.resposta.json(), {
        erro: "O corpo da requisição não é um JSON válido.",
      });
    }
  });

  it("corpo acima de 256 KB responde 413", async () => {
    const leitura = await lerCorpoJson(post(JSON.stringify({ x: "a".repeat(300 * 1024) })));
    assert.equal(leitura.ok, false);
    if (!leitura.ok) assert.equal(leitura.resposta.status, 413);
  });
});

describe("tratador padrão das funções", () => {
  const CHAVES = ["chave-certa"];
  const tratador = criarTratador({
    metodo: "GET",
    chavesAceitas: () => CHAVES,
    tratar: async () => responderJson(200, ["ok"]),
  });
  const pedido = (metodo: string, apikey?: string) =>
    new Request("http://localhost/f", { method: metodo, headers: apikey ? { apikey } : {} });

  it("OPTIONS responde o preflight antes de conferir a chave", async () => {
    assert.equal((await tratador(pedido("OPTIONS"))).status, 204);
  });

  it("sem chave válida responde 401", async () => {
    const resposta = await tratador(pedido("GET", "errada"));
    assert.equal(resposta.status, 401);
    assert.deepEqual(await resposta.json(), { erro: "Chave de acesso inválida." });
  });

  it("método diferente responde 405", async () => {
    assert.equal((await tratador(pedido("POST", "chave-certa"))).status, 405);
  });

  it("com chave e método certos, chama o tratamento", async () => {
    const resposta = await tratador(pedido("GET", "chave-certa"));
    assert.deepEqual(await resposta.json(), ["ok"]);
  });

  it("erro inesperado vira 500 sem detalhes técnicos", async () => {
    const quebrado = criarTratador({
      metodo: "GET",
      chavesAceitas: () => CHAVES,
      tratar: async () => {
        throw new Error("select * from senhas");
      },
    });
    const log = mock.method(console, "error", () => {});
    const resposta = await quebrado(pedido("GET", "chave-certa"));
    const corpo = await resposta.json();

    assert.equal(resposta.status, 500);
    assert.deepEqual(corpo, { erro: "Erro interno. Tente de novo em instantes." });
    assert.equal(log.mock.callCount(), 1);
    log.mock.restore();
  });
});
