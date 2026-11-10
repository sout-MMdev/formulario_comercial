// ================================================================
// PROCESSAR O RELATÓRIO — o "cérebro" de receber-formulario
//
//   1. valida o corpo .................... 400 se inválido
//   2. acha o executivo no banco ......... 422 se não existe ou inativo
//   3. monta o payload (recalcula o dinheiro)
//   4. grava (atômico e idempotente)
//   5. manda a cópia por e-mail (só na primeira vez) e registra
//   6. responde 200 { enviadoAoCrm, emailEnviado, emailDestino }
//
// Banco e e-mail entram como Dependencias (injeção de dependência):
// no servidor são o Supabase e o Mailpit; nos testes, versões em
// memória. Por isso este arquivo é puro e testado no Node.
// ================================================================

import { montarEmailCopia, type EnviadorEmail } from "./email.ts";
import { montarRelatorio } from "./montagem.ts";
import type { ResultadoEnvio } from "./nucleo.ts";
import type { ExecutivoCadastrado, RegistroEmail, RelatorioParaGravar } from "./tipos.ts";
import { validarDiaSalvo } from "./validacao.ts";

export interface Dependencias {
  /** Só executivos ativos; null se não existir. */
  buscarExecutivo(nome: string): Promise<ExecutivoCadastrado | null>;
  gravarRelatorio(
    relatorio: RelatorioParaGravar,
  ): Promise<{ relatorioId: number; novo: boolean; emailJaEnviado: boolean }>;
  enviador: EnviadorEmail;
  registrarEmail(registro: RegistroEmail): Promise<void>;
}

export interface RespostaProcessamento {
  status: number;
  corpo: ResultadoEnvio | { erro: string };
}

export const ERRO_EXECUTIVO = "Executivo não encontrado ou inativo.";

/**
 * Erros inesperados do banco (gravarRelatorio, buscarExecutivo) não são
 * tratados aqui: sobem para o servidor.ts, que responde 500 sem expor
 * detalhes.
 */
export async function processarRelatorio(
  corpo: unknown,
  deps: Dependencias,
): Promise<RespostaProcessamento> {
  const validacao = validarDiaSalvo(corpo);
  if (!validacao.ok) {
    return { status: 400, corpo: { erro: validacao.erro } };
  }
  const { dia } = validacao;

  const executivo = await deps.buscarExecutivo(dia.identificacao.nome.trim());
  if (!executivo) {
    return { status: 422, corpo: { erro: ERRO_EXECUTIVO } };
  }

  const relatorio = montarRelatorio(dia, executivo);
  const gravado = await deps.gravarRelatorio(relatorio);

  const emailEnviado = gravado.novo
    ? await enviarCopia(relatorio, executivo, gravado.relatorioId, deps)
    : gravado.emailJaEnviado; // reenvio: não manda a cópia de novo

  return {
    status: 200,
    corpo: { enviadoAoCrm: true, emailEnviado, emailDestino: executivo.email },
  };
}

/** Envia a cópia e registra o resultado. Falha de e-mail não derruba o envio. */
async function enviarCopia(
  relatorio: RelatorioParaGravar,
  executivo: ExecutivoCadastrado,
  relatorioId: number,
  deps: Dependencias,
): Promise<boolean> {
  const mensagem = montarEmailCopia(relatorio, executivo);
  let detalheErro: string | null = null;

  try {
    await deps.enviador.enviar(mensagem);
  } catch (erro) {
    detalheErro = erro instanceof Error ? erro.message : String(erro);
  }

  await deps.registrarEmail({
    relatorioId,
    destino: mensagem.para,
    assunto: mensagem.assunto,
    situacao: detalheErro ? "falhou" : "enviado",
    detalheErro,
  });

  return detalheErro === null;
}
