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

import { dataDeHojeIso, formatarData, formatarKm, formatarMoeda } from "./nucleo.ts";
import type { ExecutivoCadastrado, MensagemEmail, RelatorioParaGravar } from "./tipos.ts";

export interface EnviadorEmail {
  /** Envia a mensagem; lança erro se o serviço de e-mail recusar. */
  enviar(mensagem: MensagemEmail): Promise<void>;
}

const REMETENTE = { Email: "relatorios@empresa.exemplo", Name: "Relatório Comercial" };

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
      });
      if (!resposta.ok) {
        throw new Error(`Mailpit respondeu ${resposta.status}.`);
      }
    },
  };
}

/** A cópia vai SEMPRE para o e-mail cadastrado do executivo. */
export function montarEmailCopia(
  relatorio: RelatorioParaGravar,
  executivo: ExecutivoCadastrado,
): MensagemEmail {
  const data = formatarData(relatorio.data_visita ?? dataDeHojeIso());
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
