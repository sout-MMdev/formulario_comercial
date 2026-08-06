// ================================================================
// TESTES — VALIDAÇÃO
// São estas funções que liberam ou travam o botão "Continuar" nos
// dois apps. Se elas divergirem, o desktop aceitaria algo que o
// mobile recusa (ou o contrário).
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  emailValido,
  exigeComprovante,
  validarDespesas,
  validarIdentificacao,
  validarSalvarDia,
  validarVisita,
} from "./validacao.ts";
import { validarRegistroEstresse } from "./estresse.ts";
import type { Despesa, Trajeto, Visita } from "../tipos/index.ts";

function trajeto(dados: Partial<Trajeto> = {}): Trajeto {
  return {
    id: "t1",
    data: "2026-07-30",
    partida: "Curitiba - PR",
    destino: "Maringá - PR",
    km: 45,
    reembolsoKm: 58.5,
    ...dados,
  };
}

function despesa(dados: Partial<Despesa> = {}): Despesa {
  return {
    id: "d1",
    data: "2026-07-30",
    cartao: "Cartão Clara",
    categoria: "Refeição",
    valor: 40,
    nomeArquivo: "",
    ...dados,
  };
}

// ── E-mail ───────────────────────────────────────────────────────

describe("e-mail", () => {
  it("aceita endereços bem formados", () => {
    assert.ok(emailValido("parana@cativaoperadora.com.br"));
    assert.ok(emailValido("  norte@cativaoperadora.com.br  "));
  });

  it("recusa endereços incompletos", () => {
    assert.ok(!emailValido(""));
    assert.ok(!emailValido("sem-arroba.com"));
    assert.ok(!emailValido("sem@dominio"));
    assert.ok(!emailValido("com espaco@dominio.com"));
  });
});

// ── Identificação ────────────────────────────────────────────────

describe("identificação", () => {
  it("exige nome escolhido", () => {
    const r = validarIdentificacao({ nome: "", email: "a@b.com" });
    assert.ok(!r.valido);
    assert.match(r.erro ?? "", /nome/i);
  });

  it("exige e-mail válido", () => {
    const r = validarIdentificacao({ nome: "CARLA MEIRA", email: "quebrado" });
    assert.ok(!r.valido);
    assert.match(r.erro ?? "", /e-mail/i);
  });

  it("aprova nome e e-mail corretos", () => {
    const r = validarIdentificacao({
      nome: "CARLA MEIRA",
      email: "bahiasergipe@cativaoperadora.com.br",
    });
    assert.ok(r.valido);
    assert.equal(r.erro, null);
  });
});

// ── Visita ───────────────────────────────────────────────────────

describe("visita", () => {
  const comAgencia: Visita = {
    data: "2026-07-30",
    agencias: [{ id: "a1", nome: "Agência Teste" }],
  };

  it("exige a data", () => {
    const r = validarVisita({ ...comAgencia, data: "" });
    assert.ok(!r.valido);
    assert.match(r.erro ?? "", /data/i);
  });

  it("exige pelo menos uma agência com nome", () => {
    const r = validarVisita({
      data: "2026-07-30",
      agencias: [{ id: "a1", nome: "   " }],
    });
    assert.ok(!r.valido);
    assert.match(r.erro ?? "", /agência/i);
  });

  it("aprova data com ao menos uma agência nomeada", () => {
    assert.ok(validarVisita(comAgencia).valido);
  });
});

// ── Despesas ─────────────────────────────────────────────────────

describe("despesas", () => {
  it("o Cartão Pessoal exige comprovante", () => {
    assert.ok(exigeComprovante("Cartão Pessoal"));
  });

  it("o Cartão Clara não exige comprovante", () => {
    assert.ok(!exigeComprovante("Cartão Clara"));
    assert.ok(!exigeComprovante(""));
  });

  it("recusa quando não há nenhum lançamento", () => {
    const vazio = validarDespesas(
      [trajeto({ partida: "", destino: "", km: 0 })],
      [despesa({ data: "", cartao: "" })],
    );
    assert.ok(!vazio.valido);
  });

  it("recusa Cartão Pessoal sem nota fiscal anexada", () => {
    const r = validarDespesas(
      [],
      [despesa({ cartao: "Cartão Pessoal", nomeArquivo: "" })],
    );
    assert.ok(!r.valido);
    assert.match(r.erro ?? "", /nota fiscal/i);
  });

  it("aceita Cartão Pessoal com a nota anexada", () => {
    const r = validarDespesas(
      [],
      [despesa({ cartao: "Cartão Pessoal", nomeArquivo: "nota.jpg" })],
    );
    assert.ok(r.valido);
  });

  it("recusa despesa com cartão mas sem categoria", () => {
    const r = validarDespesas([], [despesa({ categoria: "" })]);
    assert.ok(!r.valido);
    assert.match(r.erro ?? "", /onde ocorreu/i);
  });

  it("aceita relatório só com trajeto, sem despesa alguma", () => {
    const r = validarDespesas([trajeto()], [despesa({ data: "", cartao: "" })]);
    assert.ok(r.valido);
  });
});

// ── Salvar o dia ─────────────────────────────────────────────────

describe("salvar o dia", () => {
  it("recusa dia completamente vazio", () => {
    const r = validarSalvarDia({ trajetos: [], agenciasVisitadas: [] });
    assert.ok(!r.valido);
  });

  it("aceita dia só com trajeto", () => {
    const r = validarSalvarDia({
      trajetos: [trajeto()],
      agenciasVisitadas: [],
    });
    assert.ok(r.valido);
  });

  it("aceita dia só com agência visitada", () => {
    const r = validarSalvarDia({
      trajetos: [],
      agenciasVisitadas: ["Agência Teste"],
    });
    assert.ok(r.valido);
  });
});

// ── Termômetro ───────────────────────────────────────────────────

describe("registro do termômetro", () => {
  it("exige um nível escolhido", () => {
    const r = validarRegistroEstresse({
      nivel: "",
      setores: ["Comercial"],
      descricao: "",
    });
    assert.ok(!r.valido);
  });

  it("exige pelo menos um setor", () => {
    const r = validarRegistroEstresse({
      nivel: "Baixo",
      setores: [],
      descricao: "",
    });
    assert.ok(!r.valido);
    assert.match(r.erro ?? "", /setor/i);
  });

  it("aceita nível Baixo sem descrição", () => {
    const r = validarRegistroEstresse({
      nivel: "Baixo",
      setores: ["Comercial"],
      descricao: "",
    });
    assert.ok(r.valido);
  });

  it("exige descrição a partir do nível Médio", () => {
    for (const nivel of ["Médio", "Alto", "Crítico"] as const) {
      const semTexto = validarRegistroEstresse({
        nivel,
        setores: ["Financeiro"],
        descricao: "   ",
      });
      assert.ok(!semTexto.valido, `${nivel} deveria exigir descrição`);

      const comTexto = validarRegistroEstresse({
        nivel,
        setores: ["Financeiro"],
        descricao: "Atraso recorrente no faturamento.",
      });
      assert.ok(comTexto.valido, `${nivel} deveria passar com descrição`);
    }
  });
});
