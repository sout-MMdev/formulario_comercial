// ================================================================
// REGRA — VALIDAÇÃO DAS ABAS
// Cada função responde: "esta aba pode avançar?". A UI usa isso
// para habilitar o botão e mostrar o motivo quando não pode.
// ================================================================

import { cartoes } from "../config/index.ts";
import type {
  Despesa,
  Identificacao,
  Trajeto,
  Visita,
} from "../tipos/index.ts";
import type { ResultadoValidacao } from "./estresse.ts";

const OK: ResultadoValidacao = { valido: true, erro: null };

function erro(mensagem: string): ResultadoValidacao {
  return { valido: false, erro: mensagem };
}

/** Formato de e-mail — checagem simples, suficiente para o caso. */
export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Aba Identificação: nome escolhido e e-mail válido. */
export function validarIdentificacao(
  identificacao: Identificacao,
): ResultadoValidacao {
  if (!identificacao.nome.trim()) {
    return erro("Selecione o seu nome para continuar.");
  }

  if (!emailValido(identificacao.email)) {
    return erro("Informe um e-mail válido para continuar.");
  }

  return OK;
}

/** Aba Visita: data preenchida e pelo menos uma agência nomeada. */
export function validarVisita(visita: Visita): ResultadoValidacao {
  if (!visita.data) {
    return erro("Informe a data da visita.");
  }

  const comNome = visita.agencias.filter((a) => a.nome.trim());
  if (comNome.length === 0) {
    return erro("Informe pelo menos uma agência visitada.");
  }

  return OK;
}

/** Um trajeto só conta se tiver partida, destino ou KM. */
export function trajetoPreenchido(trajeto: Trajeto): boolean {
  return Boolean(trajeto.partida.trim() || trajeto.destino.trim() || trajeto.km);
}

/** Uma despesa só conta se tiver data ou cartão. */
export function despesaPreenchida(despesa: Despesa): boolean {
  return Boolean(despesa.data || despesa.cartao);
}

/** O cartão escolhido obriga anexar a nota fiscal? */
export function exigeComprovante(cartao: Despesa["cartao"]): boolean {
  return cartoes.some((c) => c.valor === cartao && c.exigeComprovante);
}

/**
 * Aba Despesas: precisa de pelo menos um lançamento, e toda despesa
 * no Cartão Pessoal precisa da nota fiscal anexada.
 */
export function validarDespesas(
  trajetos: Trajeto[],
  despesas: Despesa[],
): ResultadoValidacao {
  const trajetosValidos = trajetos.filter(trajetoPreenchido);
  const despesasValidas = despesas.filter(despesaPreenchida);

  if (trajetosValidos.length === 0 && despesasValidas.length === 0) {
    return erro("Lance pelo menos um trajeto ou uma despesa.");
  }

  const semComprovante = despesasValidas.find(
    (d) => exigeComprovante(d.cartao) && !d.nomeArquivo,
  );

  if (semComprovante) {
    return erro(
      "Toda despesa no Cartão Pessoal precisa da nota fiscal anexada.",
    );
  }

  const semCategoria = despesasValidas.find((d) => d.cartao && !d.categoria);
  if (semCategoria) {
    return erro("Informe onde ocorreu o gasto em todas as despesas.");
  }

  return OK;
}

/**
 * Salvar o dia: mesma regra da v1 — é preciso ter ao menos um
 * trajeto ou uma agência visitada.
 */
export function validarSalvarDia(entrada: {
  trajetos: Trajeto[];
  agenciasVisitadas: string[];
}): ResultadoValidacao {
  const temTrajeto = entrada.trajetos.filter(trajetoPreenchido).length > 0;
  const temAgencia = entrada.agenciasVisitadas.length > 0;

  if (!temTrajeto && !temAgencia) {
    return erro(
      "Preencha pelo menos a visita do dia ou um trajeto antes de salvar.",
    );
  }

  return OK;
}
