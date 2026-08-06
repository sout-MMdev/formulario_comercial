// ================================================================
// SERVIÇO — REPOSITÓRIO LOCAL (localStorage)
// Implementação atual do RepositorioDias. Mantém a MESMA chave da
// v1 (`cativa_dias_salvos`), então nenhum dia salvo se perde.
//
// A leitura é tolerante: registros gravados pela versão antiga
// tinham outros nomes de campo (`descricao` no lugar de `cartao`,
// `cidade` no lugar de `categoria`, `reembolso` no lugar de
// `reembolsoKm`). `normalizarDia` converte tudo para o formato
// novo na hora de ler.
// ================================================================

import { CHAVE_STORAGE } from "../../config/index.ts";
import { gerarId } from "../../utils/index.ts";
import type {
  AgenciaComercial,
  Despesa,
  DiaSalvo,
  Trajeto,
} from "../../tipos/index.ts";
import type { RepositorioDias } from "./repositorioDias.ts";

/** Registro cru, como veio do localStorage (formato desconhecido). */
type RegistroCru = Record<string, unknown>;

function comoLista(valor: unknown): RegistroCru[] {
  return Array.isArray(valor) ? (valor as RegistroCru[]) : [];
}

function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function comoNumero(valor: unknown): number {
  const numero = typeof valor === "number" ? valor : parseFloat(String(valor));
  return Number.isNaN(numero) ? 0 : numero;
}

/** Converte um trajeto de qualquer versão para o formato atual. */
function normalizarTrajeto(cru: RegistroCru): Trajeto {
  return {
    id: comoTexto(cru.id) || gerarId("trajeto"),
    data: comoTexto(cru.data),
    partida: comoTexto(cru.partida),
    destino: comoTexto(cru.destino),
    km: comoNumero(cru.km),
    // v1 gravava "reembolso"; v2 grava "reembolsoKm"
    reembolsoKm: comoNumero(cru.reembolsoKm ?? cru.reembolso),
  };
}

/** Converte uma despesa de qualquer versão para o formato atual. */
function normalizarDespesa(cru: RegistroCru): Despesa {
  // v1 guardava o cartão em "descricao" e a categoria em "cidade"
  const cartao = comoTexto(cru.cartao ?? cru.descricao);

  return {
    id: comoTexto(cru.id) || gerarId("despesa"),
    data: comoTexto(cru.data),
    cartao: cartao === "Cartão Pessoal" || cartao === "Cartão Clara" ? cartao : "",
    categoria: comoTexto(cru.categoria ?? cru.cidade),
    valor: comoNumero(cru.valor ?? cru.reembolso),
    nomeArquivo: comoTexto(cru.nomeArquivo),
  };
}

/** Converte um dia inteiro para o formato atual. */
function normalizarDia(cru: RegistroCru): DiaSalvo {
  const identificacao = (cru.identificacao ?? {}) as RegistroCru;
  const visita = (cru.visita ?? {}) as RegistroCru;

  const agenciasVisitadas = Array.isArray(cru.agenciasVisitadas)
    ? (cru.agenciasVisitadas as unknown[]).map(comoTexto).filter(Boolean)
    : [];

  return {
    id: comoNumero(cru.id),
    salvadoEm: comoTexto(cru.salvadoEm),
    fluxos: Array.isArray(cru.fluxos) ? (cru.fluxos as DiaSalvo["fluxos"]) : [],
    identificacao: {
      nome: comoTexto(identificacao.nome),
      email: comoTexto(identificacao.email),
    },
    visita: {
      data: comoTexto(visita.data),
      agencias: Array.isArray(visita.agencias)
        ? (visita.agencias as RegistroCru[]).map((a) => ({
            id: comoTexto(a.id) || gerarId("agencia"),
            nome: comoTexto(a.nome),
          }))
        : agenciasVisitadas.map((nome) => ({ id: gerarId("agencia"), nome })),
    },
    agenciasVisitadas,
    agenciasComercial: comoLista(
      cru.agenciasComercial ?? cru.agencias,
    ) as unknown as AgenciaComercial[],
    trajetos: comoLista(cru.trajetos).map(normalizarTrajeto),
    despesas: comoLista(cru.despesas).map(normalizarDespesa),
  };
}

function ler(): DiaSalvo[] {
  const bruto = localStorage.getItem(CHAVE_STORAGE);
  if (!bruto) return [];

  try {
    return comoLista(JSON.parse(bruto)).map(normalizarDia);
  } catch {
    console.warn("Não foi possível ler os dias salvos. Começando do zero.");
    return [];
  }
}

function gravar(dias: DiaSalvo[]): void {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dias));
  } catch (erro) {
    console.error("Não foi possível gravar os dias salvos.", erro);
    throw erro;
  }
}

export const repositorioLocal: RepositorioDias = {
  async listar() {
    return ler();
  },

  async salvar(dia) {
    const dias = ler();
    dias.push(dia);
    gravar(dias);
    return dias;
  },

  async excluir(id) {
    const dias = ler().filter((dia) => dia.id !== id);
    gravar(dias);
    return dias;
  },

  async limpar() {
    localStorage.removeItem(CHAVE_STORAGE);
  },
};
