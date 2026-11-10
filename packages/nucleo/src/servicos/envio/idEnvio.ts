// ================================================================
// NÚMERO DE ENVIO DO DIA
// O servidor grava cada dia uma vez só por (executivo, id): se o
// mesmo id chegar de novo, ele devolve o relatório que já existe e
// não manda o e-mail outra vez. Este controle decide o id que o app
// manda:
//   * mesmo conteúdo → mesmo id (tentar de novo depois de uma falha
//     não duplica, mesmo que a resposta tenha se perdido);
//   * conteúdo editado → id novo (é outro envio);
//   * depois de um envio aceito → esquecer() e o próximo dia é novo.
// ================================================================

import type { DiaSalvo } from "../../tipos/index.ts";

/** O dia sem os campos gerados na hora de salvar. */
export type ConteudoDia = Omit<DiaSalvo, "id" | "salvadoEm">;

export interface ControleIdEnvio {
  idPara(conteudo: ConteudoDia): number;
  esquecer(): void;
}

export function criarControleIdEnvio(agora: () => number = Date.now): ControleIdEnvio {
  let ultimo: { chave: string; id: number } | null = null;

  return {
    idPara(conteudo) {
      const chave = JSON.stringify(conteudo);
      if (ultimo?.chave !== chave) ultimo = { chave, id: agora() };
      return ultimo.id;
    },
    esquecer() {
      ultimo = null;
    },
  };
}
