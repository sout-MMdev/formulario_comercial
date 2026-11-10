// ================================================================
// TESTES — NÚMERO DE ENVIO DO DIA
// O servidor não duplica um dia que chega duas vezes com o mesmo id
// (executivo + id). Por isso o app precisa mandar o MESMO id quando
// o executivo tenta de novo depois de uma falha (a resposta pode ter
// se perdido com o relatório já gravado) e um id NOVO quando o
// conteúdo mudou ou quando começa outro dia.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { criarControleIdEnvio, type ConteudoDia } from "./idEnvio.ts";

const DIA: ConteudoDia = {
  fluxos: ["despesas"],
  identificacao: { nome: "PAULO SOUZA", email: "saopaulo@empresa.exemplo" },
  visita: { data: "", agencias: [] },
  agenciasVisitadas: [],
  agenciasComercial: [],
  trajetos: [{ id: "t1", data: "", partida: "Porto Alegre - RS", destino: "Canoas - RS", km: 10, reembolsoKm: 13 }],
  despesas: [],
};

/** Relógio falso: cada chamada devolve o próximo número. */
function relogio(inicio = 1000) {
  let agora = inicio;
  return () => agora++;
}

describe("número de envio do dia", () => {
  it("tentar de novo com o mesmo conteúdo usa o mesmo número", () => {
    const controle = criarControleIdEnvio(relogio());
    const primeiro = controle.idPara(DIA);
    const segundo = controle.idPara(structuredClone(DIA));
    assert.equal(segundo, primeiro);
  });

  it("conteúdo editado depois da falha ganha número novo", () => {
    const controle = criarControleIdEnvio(relogio());
    const primeiro = controle.idPara(DIA);
    const editado = { ...DIA, trajetos: [{ ...DIA.trajetos[0], km: 12 }] };
    assert.notEqual(controle.idPara(editado), primeiro);
  });

  it("depois de um envio aceito, o mesmo conteúdo vira outro dia", () => {
    const controle = criarControleIdEnvio(relogio());
    const primeiro = controle.idPara(DIA);
    controle.esquecer();
    assert.notEqual(controle.idPara(DIA), primeiro);
  });
});
