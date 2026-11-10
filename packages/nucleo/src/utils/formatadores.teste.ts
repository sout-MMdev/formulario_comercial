// ================================================================
// TESTES — FORMATADORES
// O campo de local escreve "Cidade - UF, " e espera a rua depois da
// vírgula. Quando ninguém digita a rua, a vírgula não pode ir para o
// resumo, para o histórico nem para o envio.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { limparLocal } from "./formatadores.ts";

describe("limpar o texto do local", () => {
  it("tira a vírgula e o espaço que sobram depois da cidade", () => {
    assert.equal(limparLocal("Porto Alegre - RS, "), "Porto Alegre - RS");
  });

  it("tira a vírgula final mesmo sem espaço", () => {
    assert.equal(limparLocal("Porto Alegre - RS,"), "Porto Alegre - RS");
  });

  it("tira espaços e vírgulas repetidos nas pontas", () => {
    assert.equal(limparLocal("  Caxias do Sul - RS ,  "), "Caxias do Sul - RS");
  });

  it("mantém a rua junto da cidade", () => {
    assert.equal(
      limparLocal("Rua dos Andradas - Centro, Porto Alegre - RS"),
      "Rua dos Andradas - Centro, Porto Alegre - RS",
    );
  });

  it("devolve vazio quando não há local", () => {
    assert.equal(limparLocal(""), "");
    assert.equal(limparLocal(" , "), "");
  });
});
