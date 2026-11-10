// ================================================================
// TESTES — SITUAÇÃO DO ENVIO
// A tela de "Relatório enviado" só pode aparecer quando o CRM
// aceitou o relatório. Se o envio falhou, o executivo precisa ver
// que falhou e por quê, e não uma mensagem de sucesso.
//
// Rodar:  npm test
// ================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classificarEnvio } from "./situacaoEnvio.ts";

describe("situação do envio do relatório", () => {
  it("aceito pelo CRM e cópia enviada: mostra o e-mail da cópia", () => {
    assert.deepEqual(
      classificarEnvio({
        enviadoAoCrm: true,
        emailEnviado: true,
        emailDestino: "ana@empresa.exemplo",
      }),
      { tipo: "enviado", copia: "enviada", emailDestino: "ana@empresa.exemplo" },
    );
  });

  it("aceito pelo CRM sem e-mail informado: avisa que não achou o e-mail", () => {
    assert.deepEqual(
      classificarEnvio({ enviadoAoCrm: true, emailEnviado: false, emailDestino: "  " }),
      { tipo: "enviado", copia: "sem-email", emailDestino: "" },
    );
  });

  it("aceito pelo CRM, mas a cópia falhou: não diz que faltou o e-mail", () => {
    assert.deepEqual(
      classificarEnvio({
        enviadoAoCrm: true,
        emailEnviado: false,
        emailDestino: "ana@empresa.exemplo",
      }),
      { tipo: "enviado", copia: "falhou", emailDestino: "ana@empresa.exemplo" },
    );
  });

  it("recusado: devolve falha com o motivo vindo do envio", () => {
    assert.deepEqual(
      classificarEnvio({
        enviadoAoCrm: false,
        emailEnviado: false,
        emailDestino: "ana@empresa.exemplo",
        erro: "Executivo não encontrado ou inativo.",
      }),
      { tipo: "falhou", motivo: "Executivo não encontrado ou inativo." },
    );
  });

  it("recusado sem motivo: usa um texto padrão em vez de ficar em branco", () => {
    assert.deepEqual(
      classificarEnvio({ enviadoAoCrm: false, emailEnviado: false, emailDestino: "", erro: " " }),
      { tipo: "falhou", motivo: "Não foi possível enviar o relatório." },
    );
  });
});
