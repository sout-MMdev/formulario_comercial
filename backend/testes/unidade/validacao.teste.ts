// ================================================================
// TESTES — VALIDAÇÃO DO CORPO (servidor)
// O servidor não confia no navegador: confere a forma de cada campo,
// limites de tamanho, datas reais e as mesmas regras de negócio que a
// tela aplica (com as mesmas mensagens).
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validarDiaSalvo } from "../../supabase/functions/_compartilhado/validacao.ts";
import type { DiaSalvo } from "../../supabase/functions/_compartilhado/nucleo.ts";

/** Um dia completo e válido; cada teste muda um campo só. */
function diaValido(): DiaSalvo {
  return {
    id: 1762790000000,
    salvadoEm: "10/11/2026 10:00",
    fluxos: ["visita", "despesas"],
    identificacao: { nome: "PAULO SOUZA", email: "saopaulo@empresa.exemplo" },
    visita: { data: "2026-11-05", agencias: [{ id: "a1", nome: "Turismo Aurora" }] },
    agenciasVisitadas: ["Turismo Aurora"],
    agenciasComercial: [
      {
        id: "a1",
        nome: "Turismo Aurora",
        dataFundacao: "2010-03-01",
        faturamentoAnual: "1000000",
        faturamentoAnualLabel: "R$ 1 milhão",
        endereco: {
          cep: "90000-000", logradouro: "Rua Teste", numero: "10", complemento: "",
          bairro: "Centro", cidade: "Porto Alegre", uf: "RS",
        },
        produtos: ["Aéreo"],
        atendentes: ["Atendente Teste"],
        estresses: [{ id: "e1", nivel: "Alto", setores: ["Financeiro"], descricao: "Atraso no repasse." }],
        acoes: [{ setor: "Financeiro", detalhe: "Enviar extrato." }],
      },
    ],
    trajetos: [
      { id: "t1", data: "2026-11-05", partida: "Porto Alegre - RS", destino: "Canoas - RS", km: 10, reembolsoKm: 13 },
    ],
    despesas: [
      { id: "d1", data: "2026-11-05", cartao: "Cartão Pessoal", categoria: "Refeição", valor: 45.9, nomeArquivo: "nota.jpg" },
    ],
  };
}

function erroDe(corpo: unknown): string | null {
  const resultado = validarDiaSalvo(corpo);
  return resultado.ok ? null : resultado.erro;
}

describe("validação do corpo recebido", () => {
  it("aceita o dia válido e devolve o mesmo dia", () => {
    const resultado = validarDiaSalvo(diaValido());
    assert.equal(resultado.ok, true);
    assert.deepEqual(resultado.ok && resultado.dia, diaValido());
  });

  it("recusa corpo nulo ou que não é objeto", () => {
    assert.notEqual(erroDe(null), null);
    assert.notEqual(erroDe("texto"), null);
    assert.notEqual(erroDe([]), null);
  });

  it("recusa id que não é inteiro positivo", () => {
    assert.notEqual(erroDe({ ...diaValido(), id: -1 }), null);
    assert.notEqual(erroDe({ ...diaValido(), id: 1.5 }), null);
  });

  it("recusa fluxos vazios, desconhecidos ou repetidos", () => {
    assert.notEqual(erroDe({ ...diaValido(), fluxos: [] }), null);
    assert.notEqual(erroDe({ ...diaValido(), fluxos: ["outro"] }), null);
    assert.notEqual(erroDe({ ...diaValido(), fluxos: ["visita", "visita"] }), null);
  });

  it("recusa data que não existe ou fora do formato AAAA-MM-DD", () => {
    assert.notEqual(erroDe({ ...diaValido(), visita: { ...diaValido().visita, data: "2026-02-30" } }), null);
    assert.notEqual(erroDe({ ...diaValido(), visita: { ...diaValido().visita, data: "30/02/2026" } }), null);
  });

  it("aceita visita sem data num dia só de despesas", () => {
    const dia = { ...diaValido(), fluxos: ["despesas"], visita: { data: "", agencias: [] }, agenciasVisitadas: [], agenciasComercial: [] };
    assert.equal(erroDe(dia), null);
  });

  it("recusa mais de 30 agências", () => {
    const agencias = Array.from({ length: 31 }, (_, i) => ({ id: `a${i}`, nome: `Agência ${i}` }));
    assert.notEqual(erroDe({ ...diaValido(), visita: { data: "2026-11-05", agencias } }), null);
  });

  it("recusa km negativo ou acima de 5000", () => {
    const comKm = (km: number) => ({ ...diaValido(), trajetos: [{ ...diaValido().trajetos[0], km }] });
    assert.notEqual(erroDe(comKm(-1)), null);
    assert.notEqual(erroDe(comKm(5001)), null);
  });

  it("recusa valor de despesa acima de 100000", () => {
    const dia = { ...diaValido(), despesas: [{ ...diaValido().despesas[0], valor: 100001 }] };
    assert.notEqual(erroDe(dia), null);
  });

  it("recusa descrição de estresse com mais de 2000 caracteres", () => {
    const dia = diaValido();
    dia.agenciasComercial[0].estresses[0].descricao = "x".repeat(2001);
    assert.notEqual(erroDe(dia), null);
  });

  it("recusa texto curto com mais de 300 caracteres", () => {
    const dia = { ...diaValido(), trajetos: [{ ...diaValido().trajetos[0], partida: "x".repeat(301) }] };
    assert.notEqual(erroDe(dia), null);
  });

  it("recusa categoria fora da lista da tela, inclusive com espaço sobrando", () => {
    const comCategoria = (categoria: string) => ({ ...diaValido(), despesas: [{ ...diaValido().despesas[0], categoria }] });
    assert.notEqual(erroDe(comCategoria("Combustível")), null);
    assert.notEqual(erroDe(comCategoria("Abastecimento ")), null);
    assert.equal(erroDe(comCategoria("Abastecimento")), null);
  });

  it("recusa cartão desconhecido", () => {
    const dia = { ...diaValido(), despesas: [{ ...diaValido().despesas[0], cartao: "Cartão Ouro" }] };
    assert.notEqual(erroDe(dia), null);
  });

  it("despesa no Cartão Pessoal sem comprovante usa a mensagem da tela", () => {
    const dia = { ...diaValido(), despesas: [{ ...diaValido().despesas[0], nomeArquivo: "" }] };
    assert.equal(erroDe(dia), "Toda despesa no Cartão Pessoal precisa da nota fiscal anexada.");
  });

  it("aceita dia só de despesas com trajeto sem data", () => {
    const dia = {
      ...diaValido(),
      fluxos: ["despesas"],
      visita: { data: "", agencias: [] },
      agenciasVisitadas: [],
      agenciasComercial: [],
      trajetos: [{ ...diaValido().trajetos[0], data: "" }],
    };
    assert.equal(erroDe(dia), null);
  });

  it("estresse Alto sem descrição usa a mensagem da tela", () => {
    const dia = diaValido();
    dia.agenciasComercial[0].estresses[0].descricao = "  ";
    assert.equal(erroDe(dia), "Preencha a descrição antes de adicionar o registro.");
  });

  it("e-mail inválido usa a mensagem da tela", () => {
    const dia = { ...diaValido(), identificacao: { nome: "PAULO SOUZA", email: "sem-arroba" } };
    assert.equal(erroDe(dia), "Informe um e-mail válido para continuar.");
  });
});
