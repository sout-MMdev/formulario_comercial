// ================================================================
// TESTES — FLUXO
// A navegação é o ponto em que os dois apps mais divergem na tela,
// e justamente por isso a REGRA precisa ser a mesma. O desktop
// desenha abas e o mobile desenha passos, mas ambos perguntam
// a estas funções o que existe e em que ordem.
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  obterEstadoEtapa,
  obterEtapaInicial,
  obterEtapasVisiveis,
  obterFluxosFaltando,
} from "./fluxo.ts";

describe("etapas visíveis", () => {
  it("mostra só Identificação e Resumo antes de escolher o relatório", () => {
    assert.deepEqual(obterEtapasVisiveis([]), ["identificacao", "resumo"]);
  });

  it("monta o caminho do relatório de visita", () => {
    assert.deepEqual(obterEtapasVisiveis(["visita"]), [
      "identificacao",
      "visita",
      "agencias",
      "resumo",
    ]);
  });

  it("monta o caminho do relatório de despesas", () => {
    assert.deepEqual(obterEtapasVisiveis(["despesas"]), [
      "identificacao",
      "despesas",
      "resumo",
    ]);
  });

  it("junta os dois relatórios na ordem geral, sem repetir etapa", () => {
    const etapas = obterEtapasVisiveis(["visita", "despesas"]);

    assert.deepEqual(etapas, [
      "identificacao",
      "despesas",
      "visita",
      "agencias",
      "resumo",
    ]);

    // A ordem geral manda, não a ordem em que foram escolhidos
    assert.deepEqual(obterEtapasVisiveis(["despesas", "visita"]), etapas);
  });
});

describe("etapa inicial de cada relatório", () => {
  it("visita começa na etapa Visita", () => {
    assert.equal(obterEtapaInicial("visita"), "visita");
  });

  it("despesas começa na etapa Despesas", () => {
    assert.equal(obterEtapaInicial("despesas"), "despesas");
  });
});

describe("relatórios que faltam", () => {
  it("lista os dois quando nada foi escolhido", () => {
    assert.deepEqual(obterFluxosFaltando([]), ["visita", "despesas"]);
  });

  it("lista só o que falta", () => {
    assert.deepEqual(obterFluxosFaltando(["visita"]), ["despesas"]);
    assert.deepEqual(obterFluxosFaltando(["despesas"]), ["visita"]);
  });

  it("não sobra nada quando os dois foram preenchidos", () => {
    assert.deepEqual(obterFluxosFaltando(["visita", "despesas"]), []);
  });
});

describe("estado de cada etapa na trilha", () => {
  const etapas = obterEtapasVisiveis(["visita"]);

  it("marca a etapa atual", () => {
    assert.equal(obterEstadoEtapa("agencias", "agencias", etapas), "atual");
  });

  it("marca como concluída o que ficou para trás", () => {
    assert.equal(obterEstadoEtapa("visita", "agencias", etapas), "concluida");
    assert.equal(
      obterEstadoEtapa("identificacao", "agencias", etapas),
      "concluida",
    );
  });

  it("marca como pendente o que ainda vem", () => {
    assert.equal(obterEstadoEtapa("resumo", "agencias", etapas), "pendente");
  });
});
