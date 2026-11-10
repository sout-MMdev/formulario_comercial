// ================================================================
// TESTES — DADOS FICTÍCIOS DO FRONT E DO BANCO BATEM
// O app usa a lista de executivos do modo demonstração quando o
// servidor não responde. O nome que ele manda precisa ser EXATAMENTE
// o do banco (o servidor procura o executivo pelo nome), senão o
// envio volta "Executivo não encontrado" (ex.: ANDRE × ANDRÉ).
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  emailsExecutivos,
  executivos,
} from "../../../packages/nucleo/src/config/executivos.ts";

const seed = readFileSync(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
const doSeed = [...seed.matchAll(/\('([^']+)', '([^']+@empresa\.exemplo)', [0-9.]+\)/g)].map(
  ([, nome, email]) => ({ nome, email }),
);

describe("executivos fictícios: front e banco", () => {
  it("o seed tem os 12 executivos", () => {
    assert.equal(doSeed.length, 12);
  });

  it("o nome enviado pelo front é o mesmo do banco", () => {
    assert.deepEqual(
      executivos.map((e) => e.valor).sort(),
      doSeed.map((e) => e.nome).sort(),
    );
  });

  it("o nome mostrado na tela é o mesmo que é enviado", () => {
    for (const executivo of executivos) assert.equal(executivo.rotulo, executivo.valor);
  });

  it("cada executivo tem no front o mesmo e-mail do banco", () => {
    for (const { nome, email } of doSeed) assert.equal(emailsExecutivos[nome], email, nome);
  });
});
