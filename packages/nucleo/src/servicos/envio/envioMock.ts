// ================================================================
// ENVIO — IMPLEMENTAÇÃO SIMULADA (mock)
// Enquanto o backend não existe, esta versão apenas simula o envio:
// espera um instante (como uma chamada de rede faria) e confirma
// sucesso. Serve para a interface ficar 100% pronta e testável.
// ================================================================

import type { DiaSalvo } from "../../tipos/index.ts";
import type { ResultadoEnvio, ServicoEnvioRelatorio } from "./servicoEnvio.ts";

export const envioMock: ServicoEnvioRelatorio = {
  async enviar(dia: DiaSalvo): Promise<ResultadoEnvio> {
    // Simula a latência de gravar no CRM + disparar o e-mail
    await new Promise((resolver) => setTimeout(resolver, 700));

    const emailDestino = dia.identificacao?.email ?? "";

    // No backend real, aqui seria: POST /relatorios → { crmOk, emailOk }
    console.info("[envio simulado] Relatório enviado ao CRM:", dia.id);
    if (emailDestino) {
      console.info("[envio simulado] Cópia por e-mail para:", emailDestino);
    }

    return {
      enviadoAoCrm: true,
      emailEnviado: Boolean(emailDestino),
      emailDestino,
    };
  },
};
