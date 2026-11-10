// ================================================================
// TESTES DE INTEGRAÇÃO — as Edge Functions de verdade
// Chamam as funções pela rede, como o navegador faz, contra o
// Supabase local (banco + funções + Mailpit). Depois conferem o banco
// pela API REST com a chave de serviço.
//
// Pré-requisito:  npm run backend:iniciar
// Rodar:          npm run backend:testar-funcoes
// ================================================================

import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { lerAmbienteLocal, type AmbienteLocal } from "../../scripts/ambiente-local.ts";
import type { DiaSalvo } from "../../supabase/functions/_compartilhado/nucleo.ts";

let ambiente: AmbienteLocal;
const funcao = (nome: string) => `${ambiente.url}/functions/v1/${nome}`;

before(() => {
  ambiente = lerAmbienteLocal();
});

// ── Apoio ────────────────────────────────────────────────────────

let contador = 0;
/** Um id por envio, para os testes não colidirem entre si nem entre rodadas. */
const novoId = () => Date.now() * 100 + (contador++ % 100);

function diaValido(id: number, nome = "PAULO SOUZA"): DiaSalvo {
  return {
    id,
    salvadoEm: "10/11/2026 10:00",
    fluxos: ["visita", "despesas"],
    identificacao: { nome, email: "digitado@teste.com" },
    visita: { data: "2026-11-10", agencias: [{ id: "a1", nome: "Turismo Aurora" }] },
    agenciasVisitadas: ["Turismo Aurora"],
    agenciasComercial: [],
    trajetos: [
      { id: "t1", data: "2026-11-10", partida: "Porto Alegre - RS", destino: "Canoas - RS", km: 10, reembolsoKm: 13 },
    ],
    despesas: [
      { id: "d1", data: "2026-11-10", cartao: "Cartão Pessoal", categoria: "Refeição", valor: 45.9, nomeArquivo: "nota.jpg" },
    ],
  };
}

async function enviar(corpo: unknown): Promise<Response> {
  return fetch(funcao("receber-formulario"), {
    method: "POST",
    headers: { apikey: ambiente.chavePublica, "content-type": "application/json" },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

/** Consulta o banco pela API REST com a chave de serviço. */
async function consultar<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${ambiente.url}/rest/v1/${caminho}`, {
    headers: { apikey: ambiente.chaveServico },
  });
  assert.equal(resposta.status, 200, `REST ${caminho}`);
  return (await resposta.json()) as T;
}

// ── Testes ───────────────────────────────────────────────────────

describe("Edge Functions (integração)", () => {
  it("preflight_cors: OPTIONS é liberado para a origem do app com o cabeçalho apikey", async () => {
    const resposta = await fetch(funcao("receber-formulario"), {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5501",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "apikey, content-type",
      },
    });
    await resposta.arrayBuffer();
    // No Supabase local o gateway (Kong) responde o preflight com 200 antes
    // de chegar à função; na nuvem é a função que responde 204
    // (coberto em testes/unidade/http.teste.ts). O navegador aceita os dois.
    assert.ok(resposta.status === 200 || resposta.status === 204, `status ${resposta.status}`);
    assert.equal(resposta.headers.get("access-control-allow-origin"), "*");
    assert.match(resposta.headers.get("access-control-allow-headers") ?? "", /apikey/);
  });

  it("sem_chave_401: pedido sem a chave pública é recusado", async () => {
    const resposta = await fetch(funcao("listar-agencias"));
    const corpo = await resposta.json();
    assert.equal(resposta.status, 401);
    assert.equal(corpo.erro, "Chave de acesso inválida.");
  });

  it("lista_executivos: 12 executivos fictícios com nome e e-mail", async () => {
    const resposta = await fetch(funcao("listar-executivos"), { headers: { apikey: ambiente.chavePublica } });
    const lista = (await resposta.json()) as { nome: string; email: string }[];

    assert.equal(resposta.status, 200);
    assert.equal(lista.length, 12);
    for (const executivo of lista) {
      assert.ok(executivo.nome);
      assert.match(executivo.email, /@empresa\.exemplo$/);
    }
  });

  it("lista_agencias: 24 nomes, incluindo Turismo Aurora", async () => {
    const resposta = await fetch(funcao("listar-agencias"), { headers: { apikey: ambiente.chavePublica } });
    const lista = (await resposta.json()) as string[];

    assert.equal(resposta.status, 200);
    assert.equal(lista.length, 24);
    assert.ok(lista.includes("Turismo Aurora"));
  });

  it("envio_valido: grava no banco e manda a cópia para o e-mail cadastrado", async () => {
    const id = novoId();
    const resposta = await enviar(diaValido(id));

    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), {
      enviadoAoCrm: true,
      emailEnviado: true,
      emailDestino: "saopaulo@empresa.exemplo",
    });
    const linhas = await consultar<{ id: number }[]>(`relatorios?id_cliente=eq.${id}&select=id`);
    assert.equal(linhas.length, 1);
  });

  it("recalculo_no_servidor: reembolso usa a tarifa do banco, não o valor enviado", async () => {
    const id = novoId();
    const dia = diaValido(id, "BRUNO ROCHA");
    dia.trajetos = [{ ...dia.trajetos[0], km: 100, reembolsoKm: 1 }];
    const resposta = await enviar(dia);
    await resposta.arrayBuffer();
    assert.equal(resposta.status, 200);

    const [relatorio] = await consultar<{ total_km: number; trajetos: { reembolso: number }[] }[]>(
      `relatorios?id_cliente=eq.${id}&select=total_km,trajetos(reembolso)`,
    );
    assert.equal(relatorio.trajetos[0].reembolso, 143);
    assert.equal(relatorio.total_km, 143);
  });

  it("reenvio_idempotente: o mesmo dia duas vezes vira um relatório só", async () => {
    const id = novoId();
    const primeira = await enviar(diaValido(id));
    const segunda = await enviar(diaValido(id));
    await Promise.all([primeira.arrayBuffer(), segunda.arrayBuffer()]);

    assert.equal(primeira.status, 200);
    assert.equal(segunda.status, 200);
    const linhas = await consultar<{ id: number }[]>(`relatorios?id_cliente=eq.${id}&select=id`);
    assert.equal(linhas.length, 1);
  });

  it("email_no_mailpit: a cópia chega na caixa de teste", async () => {
    const resposta = await enviar(diaValido(novoId()));
    await resposta.arrayBuffer();

    const caixa = await fetch(`${ambiente.urlMailpit}/api/v1/messages`);
    const { messages } = (await caixa.json()) as {
      messages: { Subject: string; To: { Address: string }[] }[];
    };
    const copia = messages.find(
      (m) =>
        m.Subject === "Relatório comercial — PAULO SOUZA — 10/11/2026" &&
        m.To.some((destino) => destino.Address === "saopaulo@empresa.exemplo"),
    );
    assert.ok(copia, "cópia não encontrada no Mailpit");
  });

  it("erros_4xx: JSON inválido, método errado, corpo grande e executivo desconhecido", async () => {
    const casos: [string, Promise<Response>, number][] = [
      ["JSON inválido", enviar("{oi"), 400],
      [
        "GET em receber-formulario",
        fetch(funcao("receber-formulario"), { headers: { apikey: ambiente.chavePublica } }),
        405,
      ],
      ["corpo de 300 KB", enviar({ ...diaValido(novoId()), salvadoEm: "x".repeat(300 * 1024) }), 413],
      ["executivo inexistente", enviar(diaValido(novoId(), "FULANO INEXISTENTE")), 422],
    ];

    for (const [nome, pedido, esperado] of casos) {
      const resposta = await pedido;
      const corpo = (await resposta.json()) as { erro?: unknown };
      assert.equal(resposta.status, esperado, nome);
      assert.equal(typeof corpo.erro, "string", nome);
      assert.notEqual(corpo.erro, "", nome);
    }
  });

  it("dia_so_despesas_sem_data: aceito, como na tela", async () => {
    const dia: DiaSalvo = {
      ...diaValido(novoId()),
      fluxos: ["despesas"],
      visita: { data: "", agencias: [] },
      agenciasVisitadas: [],
      trajetos: [{ ...diaValido(0).trajetos[0], data: "" }],
      despesas: [{ ...diaValido(0).despesas[0], data: "" }],
    };
    const resposta = await enviar(dia);
    await resposta.arrayBuffer();
    assert.equal(resposta.status, 200);
  });

  it("banco_fechado_para_o_navegador: a chave pública não lê as tabelas pela API REST", async () => {
    const resposta = await fetch(`${ambiente.url}/rest/v1/relatorios?select=id`, {
      headers: { apikey: ambiente.chavePublica },
    });
    await resposta.arrayBuffer();
    assert.ok(resposta.status === 401 || resposta.status === 403, `status ${resposta.status}`);
  });
});
