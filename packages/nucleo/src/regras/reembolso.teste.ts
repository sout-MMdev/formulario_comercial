// ================================================================
// TESTES — REEMBOLSO
// Estas contas valem dinheiro real: são o que a empresa paga ao
// executivo no fim do mês. Um erro aqui aparece no bolso de
// alguém, então cada regra tem seu teste.
//
// Como os DOIS apps (desktop e mobile) chamam estas funções,
// passar aqui significa que os dois calculam igual.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularReembolsoKm,
  calcularTotaisDia,
  classificarDespesa,
  obterTarifaKm,
} from "./reembolso.ts";
import { TARIFA_KM_ESPECIAL, TARIFA_KM_PADRAO } from "../config/tarifas.ts";
import type { Despesa, Trajeto } from "../tipos/index.ts";

// ── Fábricas de dados ────────────────────────────────────────────

function trajeto(km: number, reembolsoKm: number): Trajeto {
  return {
    id: `t-${km}-${reembolsoKm}`,
    data: "2026-07-30",
    partida: "Curitiba - PR",
    destino: "Maringá - PR",
    km,
    reembolsoKm,
  };
}

function despesa(
  cartao: Despesa["cartao"],
  categoria: string,
  valor: number,
): Despesa {
  return {
    id: `d-${cartao}-${categoria}-${valor}`,
    data: "2026-07-30",
    cartao,
    categoria,
    valor,
    nomeArquivo: "",
  };
}

// ── Tarifa ───────────────────────────────────────────────────────

describe("tarifa por quilômetro", () => {
  it("aplica a tarifa padrão à maioria dos executivos", () => {
    assert.equal(obterTarifaKm("MARCELO SOUZA"), TARIFA_KM_PADRAO);
    assert.equal(obterTarifaKm("CARLA MEIRA"), TARIFA_KM_PADRAO);
  });

  it("aplica a tarifa especial a quem tem valor negociado", () => {
    assert.equal(obterTarifaKm("ADRIANA SCHLICHTA"), TARIFA_KM_ESPECIAL);
    assert.equal(obterTarifaKm("RAFAEL ANDRADE"), TARIFA_KM_ESPECIAL);
  });

  it("ignora espaços em volta do nome", () => {
    assert.equal(obterTarifaKm("  MARCOS TRE  "), TARIFA_KM_ESPECIAL);
  });

  it("usa a tarifa padrão quando não há executivo escolhido", () => {
    assert.equal(obterTarifaKm(""), TARIFA_KM_PADRAO);
  });
});

// ── Reembolso de um trajeto ──────────────────────────────────────

describe("reembolso de quilometragem", () => {
  it("multiplica os KM pela tarifa do executivo", () => {
    // 45 km × 1,30 = 58,50
    assert.equal(calcularReembolsoKm(45, "MARCELO SOUZA"), 58.5);
    // 45 km × 1,43 = 64,35
    assert.equal(calcularReembolsoKm(45, "ADRIANA SCHLICHTA"), 64.35);
  });

  it("arredonda em duas casas decimais", () => {
    // 33 × 1,43 = 47,19 exatos — sem sobra de ponto flutuante
    assert.equal(calcularReembolsoKm(33, "PABLO SANTANA"), 47.19);
    // 7 × 1,30 = 9,1
    assert.equal(calcularReembolsoKm(7, "TIAGO FANTINI"), 9.1);
  });

  it("devolve zero para quilometragem ausente, zero ou negativa", () => {
    assert.equal(calcularReembolsoKm(0, "MARCELO SOUZA"), 0);
    assert.equal(calcularReembolsoKm(-10, "MARCELO SOUZA"), 0);
    assert.equal(calcularReembolsoKm(Number.NaN, "MARCELO SOUZA"), 0);
  });
});

// ── Classificação da despesa ─────────────────────────────────────

describe("classificação da despesa", () => {
  it("soma qualquer gasto no Cartão Pessoal", () => {
    assert.equal(
      classificarDespesa(despesa("Cartão Pessoal", "Refeição", 40)),
      "reembolsado",
    );
    assert.equal(
      classificarDespesa(despesa("Cartão Pessoal", "Abastecimento", 200)),
      "reembolsado",
    );
  });

  it("desconta abastecimento no Cartão Clara", () => {
    assert.equal(
      classificarDespesa(despesa("Cartão Clara", "Abastecimento", 180)),
      "descontado",
    );
  });

  it("trata as demais categorias do Cartão Clara como informativas", () => {
    assert.equal(
      classificarDespesa(despesa("Cartão Clara", "Hospedagem", 320)),
      "informativo",
    );
    assert.equal(
      classificarDespesa(despesa("Cartão Clara", "Pedágio", 25)),
      "informativo",
    );
  });

  it("trata despesa sem cartão como informativa", () => {
    assert.equal(classificarDespesa(despesa("", "Refeição", 40)), "informativo");
  });
});

// ── Fechamento do dia ────────────────────────────────────────────

describe("fechamento do dia", () => {
  it("soma KM, soma Cartão Pessoal e subtrai abastecimento Clara", () => {
    const totais = calcularTotaisDia(
      [trajeto(45, 58.5), trajeto(30, 39)],
      [
        despesa("Cartão Pessoal", "Refeição", 42.9),
        despesa("Cartão Clara", "Abastecimento", 180),
        despesa("Cartão Clara", "Hospedagem", 320), // informativa
      ],
    );

    assert.equal(totais.totalKm, 97.5);
    assert.equal(totais.kmRodado, 75);
    assert.equal(totais.totalPessoal, 42.9);
    assert.equal(totais.totalAbastecimentoClara, 180);

    // 97,50 + 42,90 − 180,00 = −39,60
    assert.equal(Number(totais.totalFinal.toFixed(2)), -39.6);
  });

  it("não deixa a hospedagem no Clara mexer no total", () => {
    const semHospedagem = calcularTotaisDia(
      [trajeto(10, 13)],
      [despesa("Cartão Pessoal", "Refeição", 50)],
    );

    const comHospedagem = calcularTotaisDia(
      [trajeto(10, 13)],
      [
        despesa("Cartão Pessoal", "Refeição", 50),
        despesa("Cartão Clara", "Hospedagem", 999),
      ],
    );

    assert.equal(semHospedagem.totalFinal, comHospedagem.totalFinal);
  });

  it("devolve tudo zerado quando não há lançamento", () => {
    const totais = calcularTotaisDia([], []);

    assert.deepEqual(totais, {
      totalKm: 0,
      totalPessoal: 0,
      totalAbastecimentoClara: 0,
      totalFinal: 0,
      kmRodado: 0,
    });
  });

  it("fecha um dia só de visita, sem despesas", () => {
    const totais = calcularTotaisDia([trajeto(120, 156)], []);
    assert.equal(totais.totalFinal, 156);
  });
});
