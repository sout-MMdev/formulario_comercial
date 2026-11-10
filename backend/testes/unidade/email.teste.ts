// ================================================================
// TESTES — CÓPIA POR E-MAIL (servidor)
// No ambiente local o e-mail vai para o Mailpit (caixa de teste); a
// função só conhece a interface EnviadorEmail, então trocar por um
// provedor real é trocar o adaptador.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  criarEnviadorMailpit,
  montarEmailCopia,
} from "../../supabase/functions/_compartilhado/email.ts";
import type {
  ExecutivoCadastrado,
  MensagemEmail,
  RelatorioParaGravar,
} from "../../supabase/functions/_compartilhado/tipos.ts";

const EXECUTIVO: ExecutivoCadastrado = {
  id: 6,
  nome: "PAULO SOUZA",
  email: "saopaulo@empresa.exemplo",
  tarifaKm: 1.3,
};

const RELATORIO: RelatorioParaGravar = {
  executivo_id: 6,
  id_cliente: 1,
  fluxos: ["visita", "despesas"],
  data_visita: "2026-11-10",
  total_km: 32.5,
  total_pessoal: 45.9,
  total_abastecimento_clara: 30,
  total_final: 48.4,
  km_rodado: 25,
  agencias: [
    {
      nome: "Turismo Aurora", data_fundacao: null, faturamento_anual: null,
      faturamento_anual_rotulo: null, produtos: [], atendentes: [], cep: null,
      logradouro: null, numero: null, complemento: null, bairro: null,
      cidade: null, uf: null, estresses: [], acoes: [],
    },
  ],
  trajetos: [],
  despesas: [],
};

const MENSAGEM: MensagemEmail = {
  para: "saopaulo@empresa.exemplo",
  nomePara: "PAULO SOUZA",
  assunto: "Assunto",
  texto: "Texto",
};

/** fetch falso: guarda a chamada e devolve o status pedido. */
function fetchFalso(status: number) {
  const chamadas: { url: string; corpo: Record<string, unknown> }[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    chamadas.push({ url: String(url), corpo: JSON.parse(String(init?.body)) });
    return new Response("{}", { status });
  }) as typeof fetch;
  return { fn, chamadas };
}

describe("envio pelo Mailpit", () => {
  it("faz POST em <base>/api/v1/send para o destinatário da mensagem", async () => {
    const { fn, chamadas } = fetchFalso(200);
    await criarEnviadorMailpit("http://mailpit:8025", fn).enviar(MENSAGEM);

    assert.equal(chamadas[0].url, "http://mailpit:8025/api/v1/send");
    const para = chamadas[0].corpo.To as { Email: string; Name: string }[];
    assert.equal(para[0].Email, "saopaulo@empresa.exemplo");
    assert.equal(para[0].Name, "PAULO SOUZA");
    assert.deepEqual(chamadas[0].corpo.From, {
      Email: "relatorios@empresa.exemplo",
      Name: "Relatório Comercial",
    });
  });

  it("rejeita quando o Mailpit responde erro", async () => {
    const { fn } = fetchFalso(500);
    await assert.rejects(criarEnviadorMailpit("http://mailpit:8025", fn).enviar(MENSAGEM));
  });
});

describe("conteúdo da cópia", () => {
  it("vai para o e-mail cadastrado, com nome e data no assunto", () => {
    const mensagem = montarEmailCopia(RELATORIO, EXECUTIVO);

    assert.equal(mensagem.para, "saopaulo@empresa.exemplo");
    assert.equal(mensagem.assunto, "Relatório comercial — PAULO SOUZA — 10/11/2026");
  });

  it("lista as agências, o km rodado e os totais em reais", () => {
    const { texto } = montarEmailCopia(RELATORIO, EXECUTIVO);

    assert.match(texto, /Turismo Aurora/);
    assert.match(texto, /25 km/);
    assert.match(texto, /R\$\s32,50/);
    assert.match(texto, /R\$\s45,90/);
    assert.match(texto, /R\$\s30,00/);
    assert.match(texto, /R\$\s48,40/);
  });

  it("sem data da visita, usa a data de hoje no assunto", () => {
    const mensagem = montarEmailCopia({ ...RELATORIO, data_visita: null }, EXECUTIVO);
    assert.match(mensagem.assunto, /^Relatório comercial — PAULO SOUZA — \d{2}\/\d{2}\/\d{4}$/);
  });
});
