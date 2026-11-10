// ================================================================
// E-MAIL — cópia do relatório para o executivo
//
// A função só conhece a interface EnviadorEmail. Hoje o adaptador é o
// Mailpit (caixa de e-mail de teste do Supabase local); para usar um
// provedor real (Resend, SES...) basta outro adaptador com o mesmo
// método enviar(), sem mexer no resto.
//
// Arquivo puro: o fetch é injetado, então os testes rodam no Node.
// ================================================================

import { formatarData, formatarKm, formatarMoeda } from "./nucleo.ts";
import type { ExecutivoCadastrado, MensagemEmail, RelatorioParaGravar } from "./tipos.ts";

export interface EnviadorEmail {
  /** Envia a mensagem; lança erro se o serviço de e-mail recusar. */
  enviar(mensagem: MensagemEmail): Promise<void>;
}

const REMETENTE = { Email: "relatorios@empresa.exemplo", Name: "Relatório Comercial" };

/** Tempo máximo de espera pelo serviço de e-mail; depois disso, conta como falha. */
export const TEMPO_LIMITE_EMAIL_MS = 5000;

/** Adaptador do Mailpit: POST <urlBase>/api/v1/send. */
export function criarEnviadorMailpit(urlBase: string, fetchFn: typeof fetch = fetch): EnviadorEmail {
  return {
    async enviar(mensagem) {
      const resposta = await fetchFn(`${urlBase}/api/v1/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          From: REMETENTE,
          To: [{ Email: mensagem.para, Name: mensagem.nomePara }],
          Subject: mensagem.assunto,
          Text: mensagem.texto,
        }),
        signal: AbortSignal.timeout(TEMPO_LIMITE_EMAIL_MS),
      });
      if (!resposta.ok) {
        throw new Error(`Mailpit respondeu ${resposta.status}.`);
      }
    },
  };
}

/**
 * Data de hoje (AAAA-MM-DD) no horário de Brasília. O servidor roda em
 * UTC: depois das 21h, em UTC já é o dia seguinte.
 */
export function dataDeHojeEmBrasilia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** A cópia vai SEMPRE para o e-mail cadastrado do executivo. */
export function montarEmailCopia(
  relatorio: RelatorioParaGravar,
  executivo: ExecutivoCadastrado,
  agora: Date = new Date(),
): MensagemEmail {
  const data = formatarData(relatorio.data_visita ?? dataDeHojeEmBrasilia(agora));
  const agencias = relatorio.agencias.map((agencia) => agencia.nome).join(", ") || "nenhuma";

  const texto = [
    `Olá, ${executivo.nome}.`,
    "",
    `Esta é a cópia do seu relatório comercial de ${data}.`,
    "",
    `Agências visitadas: ${agencias}`,
    `Quilômetros rodados: ${formatarKm(relatorio.km_rodado)}`,
    "",
    `Reembolso de KM: ${formatarMoeda(relatorio.total_km)}`,
    `Despesas no Cartão Pessoal: ${formatarMoeda(relatorio.total_pessoal)}`,
    `Abastecimento no Cartão Clara (desconto): ${formatarMoeda(relatorio.total_abastecimento_clara)}`,
    `Total a reembolsar: ${formatarMoeda(relatorio.total_final)}`,
    "",
    "Mensagem automática do Formulário Comercial.",
  ].join("\n");

  return {
    para: executivo.email,
    nomePara: executivo.nome,
    assunto: `Relatório comercial — ${executivo.nome} — ${data}`,
    texto,
  };
}
