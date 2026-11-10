// ================================================================
// TESTES — MONTAGEM DO RELATÓRIO (servidor)
// O servidor não confia no dinheiro calculado pelo navegador: refaz
// o reembolso com a tarifa do banco e recalcula os totais com a
// mesma regra do núcleo. Também converte "" em null para o banco.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { montarRelatorio } from "../../supabase/functions/_compartilhado/montagem.ts";
import type { ExecutivoCadastrado } from "../../supabase/functions/_compartilhado/tipos.ts";
import type {
  AgenciaComercial,
  DiaSalvo,
  Despesa,
  Trajeto,
} from "../../supabase/functions/_compartilhado/nucleo.ts";

const EXECUTIVO: ExecutivoCadastrado = {
  id: 7,
  nome: "FERNANDA LIMA",
  email: "parana@empresa.exemplo",
  tarifaKm: 1.43,
};

function trajeto(km: number, reembolsoKm = 0): Trajeto {
  return { id: `t-${km}`, data: "2026-11-05", partida: "Curitiba - PR", destino: "Maringá - PR", km, reembolsoKm };
}

function despesa(cartao: Despesa["cartao"], categoria: string, valor: number): Despesa {
  return { id: `d-${categoria}`, data: "2026-11-05", cartao, categoria, valor, nomeArquivo: "nota.jpg" };
}

function comercial(id: string, nome: string, extra: Partial<AgenciaComercial> = {}): AgenciaComercial {
  return {
    id,
    nome,
    dataFundacao: "2010-01-01",
    faturamentoAnual: "",
    faturamentoAnualLabel: "",
    endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "Curitiba", uf: "PR" },
    produtos: ["Aéreo"],
    atendentes: [],
    estresses: [],
    acoes: [],
    ...extra,
  };
}

function dia(extra: Partial<DiaSalvo> = {}): DiaSalvo {
  return {
    id: 1762790000000,
    salvadoEm: "10/11/2026 10:00",
    fluxos: ["visita", "despesas"],
    identificacao: { nome: "FERNANDA LIMA", email: "parana@empresa.exemplo" },
    visita: { data: "2026-11-05", agencias: [] },
    agenciasVisitadas: [],
    agenciasComercial: [],
    trajetos: [],
    despesas: [],
    ...extra,
  };
}

describe("montagem do relatório no servidor", () => {
  it("recalcula_com_tarifa_do_banco: ignora o reembolso mandado pelo navegador", () => {
    const relatorio = montarRelatorio(dia({ trajetos: [trajeto(100, 999)] }), EXECUTIVO);

    assert.equal(relatorio.trajetos[0].reembolso, 143);
    assert.equal(relatorio.trajetos[0].tarifa_km, 1.43);
    assert.equal(relatorio.total_km, 143);
    assert.equal(relatorio.km_rodado, 100);
    assert.equal(relatorio.executivo_id, 7);
    assert.equal(relatorio.id_cliente, 1762790000000);
  });

  it("total_final_pela_formula: km + Pessoal − Abastecimento no Clara", () => {
    const relatorio = montarRelatorio(
      dia({
        trajetos: [trajeto(100)],
        despesas: [
          despesa("Cartão Pessoal", "Refeição", 50),
          despesa("Cartão Clara", "Abastecimento", 30),
          despesa("Cartão Clara", "Hospedagem", 200),
        ],
      }),
      { ...EXECUTIVO, tarifaKm: 1.3 },
    );

    assert.equal(relatorio.total_final, 150);
    assert.equal(relatorio.total_pessoal, 50);
    assert.equal(relatorio.total_abastecimento_clara, 30);
  });

  it("arredonda os totais em duas casas", () => {
    const relatorio = montarRelatorio(
      dia({
        trajetos: [trajeto(117), trajeto(117)],
        despesas: [despesa("Cartão Pessoal", "Refeição", 54.9), despesa("Cartão Clara", "Abastecimento", 180)],
      }),
      { ...EXECUTIVO, tarifaKm: 1.3 },
    );

    assert.equal(relatorio.total_final, 179.1);
  });

  it("vazios_viram_null: datas, cartão e textos opcionais vazios vão como null", () => {
    const relatorio = montarRelatorio(
      dia({
        visita: { data: "", agencias: [{ id: "a1", nome: "Turismo Aurora" }] },
        agenciasComercial: [comercial("a1", "Turismo Aurora", { dataFundacao: "" })],
        despesas: [{ id: "d1", data: "", cartao: "", categoria: "", valor: 10, nomeArquivo: "" }],
      }),
      EXECUTIVO,
    );

    assert.equal(relatorio.data_visita, null);
    assert.equal(relatorio.despesas[0].data, null);
    assert.equal(relatorio.despesas[0].cartao, null);
    assert.equal(relatorio.despesas[0].categoria, null);
    assert.equal(relatorio.despesas[0].nome_comprovante, null);
    assert.equal(relatorio.agencias[0].data_fundacao, null);
    assert.equal(relatorio.agencias[0].cep, null);
    assert.equal(relatorio.agencias[0].cidade, "Curitiba");
  });

  it("agencia_sem_bloco_comercial: entra só com o nome e listas vazias", () => {
    const relatorio = montarRelatorio(
      dia({ visita: { data: "2026-11-05", agencias: [{ id: "a9", nome: "Serra Azul Viagens" }] } }),
      EXECUTIVO,
    );

    assert.equal(relatorio.agencias.length, 1);
    assert.equal(relatorio.agencias[0].nome, "Serra Azul Viagens");
    assert.deepEqual(relatorio.agencias[0].produtos, []);
    assert.deepEqual(relatorio.agencias[0].estresses, []);
    assert.deepEqual(relatorio.agencias[0].acoes, []);
  });

  it("leva estresses e ações da agência, com descrição vazia como null", () => {
    const relatorio = montarRelatorio(
      dia({
        visita: { data: "2026-11-05", agencias: [{ id: "a1", nome: "Turismo Aurora" }] },
        agenciasComercial: [
          comercial("a1", "Turismo Aurora", {
            estresses: [
              { id: "e1", nivel: "Alto", setores: ["Financeiro"], descricao: "Atraso no repasse." },
              { id: "e2", nivel: "Baixo", setores: [], descricao: "" },
            ],
            acoes: [{ setor: "Financeiro", detalhe: "Enviar extrato." }],
          }),
        ],
      }),
      EXECUTIVO,
    );

    assert.deepEqual(relatorio.agencias[0].estresses, [
      { nivel: "Alto", setores: ["Financeiro"], descricao: "Atraso no repasse." },
      { nivel: "Baixo", setores: [], descricao: null },
    ]);
    assert.deepEqual(relatorio.agencias[0].acoes, [{ setor: "Financeiro", detalhe: "Enviar extrato." }]);
  });

  it("ignora_agencia_sem_nome", () => {
    const relatorio = montarRelatorio(
      dia({ visita: { data: "2026-11-05", agencias: [{ id: "a1", nome: "  " }] } }),
      EXECUTIVO,
    );

    assert.equal(relatorio.agencias.length, 0);
  });
});
