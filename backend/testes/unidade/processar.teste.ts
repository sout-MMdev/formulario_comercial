// ================================================================
// TESTES — PROCESSAR O RELATÓRIO (servidor)
// O passo a passo de receber-formulario, com o banco e o e-mail
// trocados por versões em memória:
//   validar → achar executivo → montar → gravar → e-mail → responder.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  processarRelatorio,
  type Dependencias,
} from "../../supabase/functions/_compartilhado/processar.ts";
import type { DiaSalvo } from "../../supabase/functions/_compartilhado/nucleo.ts";
import type {
  ExecutivoCadastrado,
  MensagemEmail,
  RegistroEmail,
  RelatorioParaGravar,
} from "../../supabase/functions/_compartilhado/tipos.ts";

const CADASTRADO: ExecutivoCadastrado = {
  id: 6,
  nome: "PAULO SOUZA",
  email: "saopaulo@empresa.exemplo",
  tarifaKm: 1.3,
};

function diaValido(): DiaSalvo {
  return {
    id: 1762790000000,
    salvadoEm: "10/11/2026 10:00",
    fluxos: ["despesas"],
    identificacao: { nome: " PAULO SOUZA ", email: "saopaulo@empresa.exemplo" },
    visita: { data: "", agencias: [] },
    agenciasVisitadas: [],
    agenciasComercial: [],
    trajetos: [
      { id: "t1", data: "2026-11-10", partida: "Porto Alegre - RS", destino: "Canoas - RS", km: 10, reembolsoKm: 0 },
    ],
    despesas: [],
  };
}

/** Banco e e-mail em memória; cada teste ajusta o que precisa. */
function montarDependencias(opcoes: {
  executivo?: ExecutivoCadastrado | null;
  novo?: boolean;
  emailJaEnviado?: boolean;
  falhaEmail?: boolean;
} = {}) {
  const registro = {
    nomesBuscados: [] as string[],
    gravados: [] as RelatorioParaGravar[],
    enviados: [] as MensagemEmail[],
    emails: [] as RegistroEmail[],
  };
  const deps: Dependencias = {
    async buscarExecutivo(nome) {
      registro.nomesBuscados.push(nome);
      return opcoes.executivo === undefined ? CADASTRADO : opcoes.executivo;
    },
    async gravarRelatorio(relatorio) {
      registro.gravados.push(relatorio);
      return { relatorioId: 42, novo: opcoes.novo ?? true, emailJaEnviado: opcoes.emailJaEnviado ?? false };
    },
    enviador: {
      async enviar(mensagem) {
        if (opcoes.falhaEmail) throw new Error("Mailpit fora do ar");
        registro.enviados.push(mensagem);
      },
    },
    async registrarEmail(r) {
      registro.emails.push(r);
    },
  };
  return { deps, registro };
}

describe("processar o relatório recebido", () => {
  it("corpo_invalido_400: não grava nada", async () => {
    const { deps, registro } = montarDependencias();
    const resposta = await processarRelatorio({ id: "x" }, deps);

    assert.equal(resposta.status, 400);
    assert.ok("erro" in resposta.corpo);
    assert.equal(registro.gravados.length, 0);
  });

  it("executivo_desconhecido_422: nome fora do cadastro ou inativo", async () => {
    const { deps, registro } = montarDependencias({ executivo: null });
    const resposta = await processarRelatorio(diaValido(), deps);

    assert.equal(resposta.status, 422);
    assert.deepEqual(resposta.corpo, { erro: "Executivo não encontrado ou inativo." });
    assert.equal(registro.gravados.length, 0);
  });

  it("sucesso_200: grava, envia a cópia e registra o e-mail como enviado", async () => {
    const { deps, registro } = montarDependencias();
    const resposta = await processarRelatorio(diaValido(), deps);

    assert.equal(resposta.status, 200);
    assert.deepEqual(resposta.corpo, {
      enviadoAoCrm: true,
      emailEnviado: true,
      emailDestino: "saopaulo@empresa.exemplo",
    });
    assert.deepEqual(registro.nomesBuscados, ["PAULO SOUZA"]);
    assert.equal(registro.gravados[0].trajetos[0].reembolso, 13);
    assert.equal(registro.emails[0].situacao, "enviado");
    assert.equal(registro.emails[0].relatorioId, 42);
  });

  it("email_para_o_cadastrado: ignora o e-mail digitado no formulário", async () => {
    const { deps, registro } = montarDependencias();
    const dia = { ...diaValido(), identificacao: { nome: "PAULO SOUZA", email: "outro@teste.com" } };
    const resposta = await processarRelatorio(dia, deps);

    assert.equal(registro.enviados[0].para, "saopaulo@empresa.exemplo");
    assert.equal("emailDestino" in resposta.corpo && resposta.corpo.emailDestino, "saopaulo@empresa.exemplo");
  });

  it("mailpit_fora_200: o relatório fica salvo e a falha é registrada", async () => {
    const { deps, registro } = montarDependencias({ falhaEmail: true });
    const resposta = await processarRelatorio(diaValido(), deps);

    assert.equal(resposta.status, 200);
    assert.equal("emailEnviado" in resposta.corpo && resposta.corpo.emailEnviado, false);
    assert.equal(registro.emails[0].situacao, "falhou");
    assert.match(registro.emails[0].detalheErro ?? "", /Mailpit fora do ar/);
  });

  it("reenvio_nao_reenvia_email: devolve se a cópia já tinha sido enviada", async () => {
    const { deps, registro } = montarDependencias({ novo: false, emailJaEnviado: true });
    const resposta = await processarRelatorio(diaValido(), deps);

    assert.equal(resposta.status, 200);
    assert.equal("emailEnviado" in resposta.corpo && resposta.corpo.emailEnviado, true);
    assert.equal(registro.enviados.length, 0);
    assert.equal(registro.emails.length, 0);
  });
});
