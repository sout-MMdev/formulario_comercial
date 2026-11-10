// ================================================================
// TESTES — LIGAR/DESLIGAR OS APPS DO BACK-END LOCAL
// Com apps/*/.env.local o front usa o Supabase local; sem eles, volta
// ao modo demonstração. Os testes usam uma pasta temporária.
//
// Rodar:  npm test
// ================================================================

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  APPS,
  conectarApps,
  desconectarApps,
  montarEnvLocal,
} from "../../scripts/env-local.ts";

let raiz: string;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), "env-local-"));
  for (const app of APPS) mkdirSync(join(raiz, app), { recursive: true });
});

afterEach(() => rmSync(raiz, { recursive: true, force: true }));

describe("arquivos .env.local dos apps", () => {
  it("o conteúdo traz a URL e a chave pública nas variáveis que o front lê", () => {
    assert.equal(
      montarEnvLocal("http://127.0.0.1:54321", "chave-publica"),
      "VITE_SUPABASE_URL=http://127.0.0.1:54321\nVITE_SUPABASE_ANON_KEY=chave-publica\n",
    );
  });

  it("conectar escreve o .env.local nos dois apps", () => {
    const escritos = conectarApps(raiz, "http://127.0.0.1:54321", "chave-publica");

    assert.deepEqual(escritos, APPS.map((app) => join(app, ".env.local")));
    for (const app of APPS) {
      const conteudo = readFileSync(join(raiz, app, ".env.local"), "utf8");
      assert.match(conteudo, /^VITE_SUPABASE_URL=http:\/\/127\.0\.0\.1:54321$/m);
    }
  });

  it("desconectar apaga os arquivos e não falha se já não existirem", () => {
    conectarApps(raiz, "http://127.0.0.1:54321", "chave-publica");
    desconectarApps(raiz);
    desconectarApps(raiz);

    for (const app of APPS) assert.equal(existsSync(join(raiz, app, ".env.local")), false);
  });
});
