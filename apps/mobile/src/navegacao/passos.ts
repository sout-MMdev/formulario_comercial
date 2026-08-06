// ================================================================
// NAVEGAÇÃO — OS PASSOS DO APP MOBILE
//
// O desktop navega por ABAS (5 telas densas). O celular navega por
// PASSOS: um assunto por tela, sequência linear, sempre sabendo
// quantos faltam.
//
// A lógica de fluxo continua sendo a do núcleo: quais relatórios
// foram escolhidos define quais passos existem. O que muda é só a
// granularidade — a aba "Despesas" do desktop vira dois passos
// aqui (trajetos e gastos).
// ================================================================

import { FLUXOS } from "@cativa/nucleo/config";
import type { NomeFluxo } from "@cativa/nucleo/tipos";

/** Cada tela do app mobile. */
export type NomePasso =
  | "executivo" // quem está preenchendo
  | "relatorio" // qual relatório do dia
  | "data-visita" // quando foi a visita
  | "agencias" // quais agências foram visitadas
  | "analise" // perfil + termômetro de cada agência
  | "trajetos" // deslocamentos com reembolso de KM
  | "gastos" // despesas com comprovante
  | "resumo"; // conferência e salvamento

export interface DefinicaoPasso {
  nome: NomePasso;
  /** Pergunta que dá título à tela. */
  titulo: string;
  /** Frase de apoio abaixo do título. */
  apoio: string;
}

export const PASSOS: Record<NomePasso, DefinicaoPasso> = {
  executivo: {
    titulo: "Quem está preenchendo?",
    apoio: "Selecione seu nome — o e-mail é preenchido automaticamente.",
    nome: "executivo",
  },
  relatorio: {
    titulo: "O que você vai registrar?",
    apoio: "Dá para preencher o outro relatório depois, no mesmo dia.",
    nome: "relatorio",
  },
  "data-visita": {
    titulo: "Quando foi a visita?",
    apoio: "A data vale para todas as agências deste relatório.",
    nome: "data-visita",
  },
  agencias: {
    titulo: "Quais agências você visitou?",
    apoio: "Adicione uma por vez. Cada uma será detalhada em seguida.",
    nome: "agencias",
  },
  analise: {
    titulo: "Como foi em cada agência?",
    apoio: "Toque em uma agência para registrar perfil e termômetro.",
    nome: "analise",
  },
  trajetos: {
    titulo: "Quais trajetos você rodou?",
    apoio: "O reembolso é calculado pela sua tarifa por quilômetro.",
    nome: "trajetos",
  },
  gastos: {
    titulo: "Teve algum gasto?",
    apoio: "Cartão Pessoal soma ao reembolso; abastecimento no Clara desconta.",
    nome: "gastos",
  },
  resumo: {
    titulo: "Confira antes de salvar",
    apoio: "Nada é gravado até você confirmar.",
    nome: "resumo",
  },
};

/**
 * Os passos de cada relatório, na ordem.
 * Espelha FLUXOS do núcleo, só que mais granular:
 *   FLUXOS.visita   = [identificacao, visita, agencias, resumo]
 *   aqui            = [data-visita, agencias, analise]
 */
const PASSOS_POR_FLUXO: Record<NomeFluxo, NomePasso[]> = {
  visita: ["data-visita", "agencias", "analise"],
  despesas: ["trajetos", "gastos"],
};

/**
 * Monta a sequência de telas para o estado atual.
 * Enquanto nenhum relatório foi escolhido, só existem os dois
 * primeiros passos — não faz sentido mostrar um progresso de 8
 * telas para quem ainda nem disse o que vai preencher.
 */
export function montarSequencia(fluxosAdicionados: NomeFluxo[]): NomePasso[] {
  const sequencia: NomePasso[] = ["executivo", "relatorio"];

  if (fluxosAdicionados.length === 0) return sequencia;

  // A ordem dos relatórios respeita a ordem em que foram escolhidos
  fluxosAdicionados.forEach((fluxo) => {
    PASSOS_POR_FLUXO[fluxo].forEach((passo) => {
      if (!sequencia.includes(passo)) sequencia.push(passo);
    });
  });

  sequencia.push("resumo");
  return sequencia;
}

/** A qual relatório um passo pertence (para rotular a tela). */
export function fluxoDoPasso(passo: NomePasso): NomeFluxo | null {
  const entrada = (Object.keys(PASSOS_POR_FLUXO) as NomeFluxo[]).find((fluxo) =>
    PASSOS_POR_FLUXO[fluxo].includes(passo),
  );
  return entrada ?? null;
}

/** Confere que todo passo de FLUXOS tem cobertura aqui. */
export const FLUXOS_COBERTOS = Object.keys(FLUXOS) as NomeFluxo[];
