// ================================================================
// REDUCER DO FORMULÁRIO
// Estado único do dia em preenchimento. Toda mudança passa por
// uma ação nomeada — nada de setState espalhado pelos componentes.
//
// Escalabilidade: para adicionar um campo novo, inclua-o no tipo
// (nucleo/tipos), no estado inicial e trate a ação correspondente.
// Nenhum componente irmão precisa saber.
// ================================================================

import { obterEtapaInicial } from "../regras/index.ts";
import { calcularReembolsoKm } from "../regras/index.ts";
import { gerarId } from "../utils/index.ts";
import { enderecoVazio } from "../servicos/viacep.ts";
import type {
  AgenciaComercial,
  Despesa,
  Identificacao,
  NomeEtapa,
  NomeFluxo,
  RelatorioDia,
  Trajeto,
} from "../tipos/index.ts";

// ── Estado ───────────────────────────────────────────────────────

export interface EstadoFormulario extends RelatorioDia {
  etapaAtual: NomeEtapa;
}

export function criarTrajetoVazio(): Trajeto {
  return {
    id: gerarId("trajeto"),
    data: "",
    partida: "",
    destino: "",
    km: 0,
    reembolsoKm: 0,
  };
}

export function criarDespesaVazia(): Despesa {
  return {
    id: gerarId("despesa"),
    data: "",
    cartao: "",
    categoria: "",
    valor: 0,
    nomeArquivo: "",
  };
}

export function criarAgenciaVisitada() {
  return { id: gerarId("agencia"), nome: "" };
}

function criarAgenciaComercial(id: string, nome: string): AgenciaComercial {
  return {
    id,
    nome,
    dataFundacao: "",
    faturamentoAnual: "",
    faturamentoAnualLabel: "",
    endereco: enderecoVazio(),
    produtos: [],
    atendentes: [],
    estresses: [],
    acoes: [],
  };
}

export const estadoInicial: EstadoFormulario = {
  etapaAtual: "identificacao",
  identificacao: { nome: "", email: "" },
  visita: { data: "", agencias: [criarAgenciaVisitada()] },
  agenciasComercial: [],
  trajetos: [criarTrajetoVazio()],
  despesas: [criarDespesaVazia()],
  fluxosAdicionados: [],
};

// ── Ações ────────────────────────────────────────────────────────

export type AcaoFormulario =
  // Navegação
  | { tipo: "ir-para-etapa"; etapa: NomeEtapa }
  | { tipo: "escolher-fluxo"; fluxo: NomeFluxo }
  | { tipo: "adicionar-fluxo"; fluxo: NomeFluxo }
  // Identificação
  | { tipo: "definir-identificacao"; dados: Partial<Identificacao> }
  // Visita
  | { tipo: "definir-data-visita"; data: string }
  | { tipo: "adicionar-agencia-visitada" }
  | { tipo: "alterar-agencia-visitada"; id: string; nome: string }
  | { tipo: "remover-agencia-visitada"; id: string }
  // Agências (comercial + termômetro)
  | { tipo: "sincronizar-agencias" }
  | {
      tipo: "alterar-agencia-comercial";
      id: string;
      dados: Partial<AgenciaComercial>;
    }
  // Trajetos
  | { tipo: "adicionar-trajeto" }
  | { tipo: "alterar-trajeto"; id: string; dados: Partial<Trajeto> }
  | { tipo: "remover-trajeto"; id: string }
  // Despesas
  | { tipo: "adicionar-despesa" }
  | { tipo: "alterar-despesa"; id: string; dados: Partial<Despesa> }
  | { tipo: "remover-despesa"; id: string }
  // Ciclo de vida
  | { tipo: "reiniciar" };

// ── Auxiliares ───────────────────────────────────────────────────

/** Aplica `dados` ao item de `id` e devolve uma lista nova. */
function alterarNaLista<T extends { id: string }>(
  lista: T[],
  id: string,
  dados: Partial<T>,
): T[] {
  return lista.map((item) => (item.id === id ? { ...item, ...dados } : item));
}

/**
 * Recalcula o reembolso de todos os trajetos.
 * Chamado quando o KM muda OU quando o executivo muda — a tarifa
 * é pessoal, então trocar de nome tem que refazer a conta.
 */
function recalcularTrajetos(
  trajetos: Trajeto[],
  nomeExecutivo: string,
): Trajeto[] {
  return trajetos.map((trajeto) => ({
    ...trajeto,
    reembolsoKm: calcularReembolsoKm(trajeto.km, nomeExecutivo),
  }));
}

/**
 * Espelha as agências da aba Visita na aba Agências.
 * Mantém o que já foi preenchido (casando pelo id) e descarta os
 * blocos de agências que foram removidas da lista.
 */
function sincronizarAgencias(estado: EstadoFormulario): AgenciaComercial[] {
  return estado.visita.agencias
    .filter((agencia) => agencia.nome.trim())
    .map((agencia) => {
      const existente = estado.agenciasComercial.find(
        (item) => item.id === agencia.id,
      );

      if (existente) {
        return { ...existente, nome: agencia.nome.trim() };
      }

      return criarAgenciaComercial(agencia.id, agencia.nome.trim());
    });
}

// ── Reducer ──────────────────────────────────────────────────────

export function formularioReducer(
  estado: EstadoFormulario,
  acao: AcaoFormulario,
): EstadoFormulario {
  switch (acao.tipo) {
    // ── Navegação ────────────────────────────────────────────────
    case "ir-para-etapa": {
      // Ao entrar em Agências, os blocos são montados a partir da
      // lista preenchida na aba Visita, e a data é herdada.
      if (acao.etapa === "agencias") {
        return {
          ...estado,
          etapaAtual: acao.etapa,
          agenciasComercial: sincronizarAgencias(estado),
        };
      }

      return { ...estado, etapaAtual: acao.etapa };
    }

    case "escolher-fluxo": {
      return {
        ...estado,
        fluxosAdicionados: [acao.fluxo],
        etapaAtual: obterEtapaInicial(acao.fluxo),
      };
    }

    case "adicionar-fluxo": {
      if (estado.fluxosAdicionados.includes(acao.fluxo)) return estado;

      return {
        ...estado,
        fluxosAdicionados: [...estado.fluxosAdicionados, acao.fluxo],
        etapaAtual: obterEtapaInicial(acao.fluxo),
      };
    }

    // ── Identificação ────────────────────────────────────────────
    case "definir-identificacao": {
      const identificacao = { ...estado.identificacao, ...acao.dados };

      // Trocar de executivo pode trocar a tarifa por KM.
      const trajetos =
        acao.dados.nome !== undefined
          ? recalcularTrajetos(estado.trajetos, identificacao.nome)
          : estado.trajetos;

      return { ...estado, identificacao, trajetos };
    }

    // ── Visita ───────────────────────────────────────────────────
    case "definir-data-visita": {
      return { ...estado, visita: { ...estado.visita, data: acao.data } };
    }

    case "adicionar-agencia-visitada": {
      return {
        ...estado,
        visita: {
          ...estado.visita,
          agencias: [...estado.visita.agencias, criarAgenciaVisitada()],
        },
      };
    }

    case "alterar-agencia-visitada": {
      return {
        ...estado,
        visita: {
          ...estado.visita,
          agencias: alterarNaLista(estado.visita.agencias, acao.id, {
            nome: acao.nome,
          }),
        },
      };
    }

    case "remover-agencia-visitada": {
      const restantes = estado.visita.agencias.filter(
        (agencia) => agencia.id !== acao.id,
      );

      return {
        ...estado,
        visita: {
          ...estado.visita,
          // Nunca deixa a lista vazia: sempre sobra uma linha em branco.
          agencias: restantes.length > 0 ? restantes : [criarAgenciaVisitada()],
        },
        agenciasComercial: estado.agenciasComercial.filter(
          (agencia) => agencia.id !== acao.id,
        ),
      };
    }

    // ── Agências ─────────────────────────────────────────────────
    case "sincronizar-agencias": {
      return { ...estado, agenciasComercial: sincronizarAgencias(estado) };
    }

    case "alterar-agencia-comercial": {
      return {
        ...estado,
        agenciasComercial: alterarNaLista(
          estado.agenciasComercial,
          acao.id,
          acao.dados,
        ),
      };
    }

    // ── Trajetos ─────────────────────────────────────────────────
    case "adicionar-trajeto": {
      return { ...estado, trajetos: [...estado.trajetos, criarTrajetoVazio()] };
    }

    case "alterar-trajeto": {
      const trajetos = alterarNaLista(estado.trajetos, acao.id, acao.dados);

      // Mexeu no KM? Refaz o reembolso daquele trajeto.
      if (acao.dados.km !== undefined) {
        return {
          ...estado,
          trajetos: trajetos.map((trajeto) =>
            trajeto.id === acao.id
              ? {
                  ...trajeto,
                  reembolsoKm: calcularReembolsoKm(
                    trajeto.km,
                    estado.identificacao.nome,
                  ),
                }
              : trajeto,
          ),
        };
      }

      return { ...estado, trajetos };
    }

    case "remover-trajeto": {
      const restantes = estado.trajetos.filter(
        (trajeto) => trajeto.id !== acao.id,
      );

      return {
        ...estado,
        trajetos: restantes.length > 0 ? restantes : [criarTrajetoVazio()],
      };
    }

    // ── Despesas ─────────────────────────────────────────────────
    case "adicionar-despesa": {
      return { ...estado, despesas: [...estado.despesas, criarDespesaVazia()] };
    }

    case "alterar-despesa": {
      const despesas = alterarNaLista(estado.despesas, acao.id, acao.dados);

      // Trocar o cartão zera a categoria e o anexo: as regras de
      // comprovante mudam entre Cartão Pessoal e Cartão Clara.
      if (acao.dados.cartao !== undefined) {
        return {
          ...estado,
          despesas: despesas.map((despesa) =>
            despesa.id === acao.id
              ? { ...despesa, categoria: "", nomeArquivo: "" }
              : despesa,
          ),
        };
      }

      return { ...estado, despesas };
    }

    case "remover-despesa": {
      const restantes = estado.despesas.filter(
        (despesa) => despesa.id !== acao.id,
      );

      return {
        ...estado,
        despesas: restantes.length > 0 ? restantes : [criarDespesaVazia()],
      };
    }

    // ── Ciclo de vida ────────────────────────────────────────────
    case "reiniciar": {
      // Mantém quem está preenchendo — o executivo é o mesmo o dia todo.
      return {
        ...estadoInicial,
        identificacao: estado.identificacao,
        visita: { data: "", agencias: [criarAgenciaVisitada()] },
        trajetos: [criarTrajetoVazio()],
        despesas: [criarDespesaVazia()],
      };
    }

    default:
      return estado;
  }
}
