// ================================================================
// SERVIÇO — ENVIO DO RELATÓRIO
// O ato de "finalizar" um relatório: mandá-lo ao CRM e disparar a
// cópia por e-mail para o executivo.
//
// >>> PONTO DE INTEGRAÇÃO COM O CRM <<<
// Quando o backend existir, crie um `envioApi.ts` que implemente
// esta interface com fetch() (POST /relatorios) e troque a linha
// final de `index.ts`. Nenhum componente precisa mudar.
// ================================================================

import type { DiaSalvo } from "../../tipos/index.ts";

/** Resultado de uma finalização de relatório. */
export interface ResultadoEnvio {
  /** O relatório foi aceito pelo CRM. */
  enviadoAoCrm: boolean;
  /** A cópia por e-mail foi disparada. */
  emailEnviado: boolean;
  /** Para qual e-mail a cópia foi enviada. */
  emailDestino: string;
  /** Mensagem de erro, quando algo falha. */
  erro?: string;
}

export interface ServicoEnvioRelatorio {
  /**
   * Finaliza o relatório do dia: grava no CRM e envia a cópia por
   * e-mail. Devolve o que aconteceu, para a tela dar o retorno certo.
   */
  enviar(dia: DiaSalvo): Promise<ResultadoEnvio>;
}
