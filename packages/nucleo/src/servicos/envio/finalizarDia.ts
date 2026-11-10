// ================================================================
// FINALIZAR O DIA
// Envia o relatório ao CRM e, só se ele foi aceito, guarda a cópia
// local. Quando o envio falha, nada é gravado: o app mantém o
// formulário preenchido para o executivo tentar de novo, sem criar
// cópias repetidas no histórico do aparelho.
// ================================================================

import type { DiaSalvo } from "../../tipos/index.ts";
import type { RepositorioDias } from "../armazenamento/repositorioDias.ts";
import type { ResultadoEnvio, ServicoEnvioRelatorio } from "./servicoEnvio.ts";

export interface DependenciasFinalizar {
  repositorio: Pick<RepositorioDias, "salvar">;
  envio: ServicoEnvioRelatorio;
}

export async function finalizarDia(
  dia: DiaSalvo,
  { repositorio, envio }: DependenciasFinalizar,
): Promise<ResultadoEnvio> {
  const resultado = await envio.enviar(dia);
  if (resultado.enviadoAoCrm) {
    try {
      await repositorio.salvar(dia);
    } catch (erro) {
      // O relatório já está no servidor: uma falha só no histórico do
      // aparelho (ex.: armazenamento cheio) não vira erro de envio.
      console.error("Não foi possível guardar a cópia local do dia:", erro);
    }
  }
  return resultado;
}
