// ================================================================
// TESTES — FINALIZAR O DIA
// A cópia local só é gravada quando o CRM aceitou o relatório.
// Se o envio falha, nada é gravado: o formulário continua preenchido
// e o executivo tenta de novo sem criar cópias repetidas.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DiaSalvo } from "../../tipos/index.ts";
import type { ResultadoEnvio } from "./servicoEnvio.ts";
import { finalizarDia } from "./finalizarDia.ts";

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

function montar(resultado: ResultadoEnvio) {
  const gravados: DiaSalvo[] = [];
  const deps = {
    repositorio: {
      salvar: async (dia: DiaSalvo) => {
        gravados.push(dia);
        return gravados;
      },
    },
    envio: { enviar: async () => resultado },
  };
  return { deps, gravados };
}

describe("finalizar o dia", () => {
  it("envio aceito: grava a cópia local e devolve o resultado", async () => {
    const aceito = { enviadoAoCrm: true, emailEnviado: true, emailDestino: "ana@empresa.exemplo" };
    const { deps, gravados } = montar(aceito);

    const resultado = await finalizarDia(DIA, deps);

    assert.deepEqual(resultado, aceito);
    assert.deepEqual(gravados, [DIA]);
  });

  it("envio recusado: não grava cópia local", async () => {
    const recusado = {
      enviadoAoCrm: false,
      emailEnviado: false,
      emailDestino: "ana@empresa.exemplo",
      erro: "Não foi possível enviar o relatório.",
    };
    const { deps, gravados } = montar(recusado);

    const resultado = await finalizarDia(DIA, deps);

    assert.deepEqual(resultado, recusado);
    assert.equal(gravados.length, 0);
  });
});
