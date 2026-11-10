// ================================================================
// CONTEXTO DO FORMULÁRIO
// Entrega o estado do dia e as ações para qualquer aba, sem
// precisar passar props por vários níveis.
// ================================================================

import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  calcularTotaisDia,
  obterEtapasVisiveis,
  obterFluxosFaltando,
} from "@cativa/nucleo/regras";
import { emailDoExecutivo } from "@cativa/nucleo/servicos/executivos";
import { gerarId, limparLocal } from "@cativa/nucleo/utils";
import { repositorioDias } from "@cativa/nucleo/servicos/armazenamento";
import {
  finalizarDia,
  servicoEnvio,
  type ResultadoEnvio,
} from "@cativa/nucleo/servicos/envio";
import type {
  DiaSalvo,
  NomeEtapa,
  NomeFluxo,
  TotaisDia,
} from "@cativa/nucleo/tipos";
import {
  estadoInicial,
  formularioReducer,
  type AcaoFormulario,
  type EstadoFormulario,
} from "@cativa/nucleo/estado";

interface ValorContexto {
  /** Estado completo do dia em preenchimento. */
  estado: EstadoFormulario;
  /** Dispara uma ação do reducer. */
  despachar: React.Dispatch<AcaoFormulario>;

  // Derivados — calculados a partir do estado
  totais: TotaisDia;
  etapasVisiveis: NomeEtapa[];
  fluxosFaltando: NomeFluxo[];
  agenciasVisitadas: string[];

  // Atalhos usados por várias abas
  irParaEtapa: (etapa: NomeEtapa) => void;
  selecionarExecutivo: (nome: string) => void;
  montarDiaParaSalvar: () => DiaSalvo;
  salvarDia: () => Promise<ResultadoEnvio>;
}

export const FormularioContexto = createContext<ValorContexto | null>(null);

export function ProvedorFormulario({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(formularioReducer, estadoInicial);

  // ── Derivados ──────────────────────────────────────────────────

  const totais = useMemo(
    () => calcularTotaisDia(estado.trajetos, estado.despesas),
    [estado.trajetos, estado.despesas],
  );

  const etapasVisiveis = useMemo(
    () => obterEtapasVisiveis(estado.fluxosAdicionados),
    [estado.fluxosAdicionados],
  );

  const fluxosFaltando = useMemo(
    () => obterFluxosFaltando(estado.fluxosAdicionados),
    [estado.fluxosAdicionados],
  );

  const agenciasVisitadas = useMemo(
    () =>
      estado.visita.agencias
        .map((agencia) => agencia.nome.trim())
        .filter(Boolean),
    [estado.visita.agencias],
  );

  // ── Atalhos ────────────────────────────────────────────────────

  const irParaEtapa = useCallback((etapa: NomeEtapa) => {
    despachar({ tipo: "ir-para-etapa", etapa });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /** Escolher o nome preenche o e-mail cadastrado do executivo. */
  const selecionarExecutivo = useCallback((nome: string) => {
    despachar({
      tipo: "definir-identificacao",
      dados: { nome, email: emailDoExecutivo(nome) },
    });
  }, []);

  const montarDiaParaSalvar = useCallback((): DiaSalvo => {
    return {
      id: Date.now(),
      salvadoEm: new Date().toLocaleString("pt-BR"),
      fluxos: [...estado.fluxosAdicionados],
      identificacao: { ...estado.identificacao },
      visita: {
        data: estado.visita.data,
        agencias: estado.visita.agencias
          .filter((agencia) => agencia.nome.trim())
          .map((agencia) => ({ ...agencia, nome: agencia.nome.trim() })),
      },
      agenciasVisitadas,
      agenciasComercial: estado.agenciasComercial.map((agencia) => ({
        ...agencia,
      })),
      // Guarda só o que foi realmente preenchido — linhas em branco
      // criadas pelo "+ Adicionar" não viram registro.
      trajetos: estado.trajetos
        .filter((t) => t.partida.trim() || t.destino.trim() || t.km)
        .map((t) => ({
          ...t,
          partida: limparLocal(t.partida),
          destino: limparLocal(t.destino),
        })),
      despesas: estado.despesas
        .filter((d) => d.data || d.cartao)
        .map((d) => ({ ...d })),
    };
  }, [estado, agenciasVisitadas]);

  const salvarDia = useCallback(async (): Promise<ResultadoEnvio> => {
    const dia = montarDiaParaSalvar();
    // Envia ao CRM (+ cópia por e-mail); a cópia local só é gravada se
    // o envio foi aceito. O formulário NÃO é zerado aqui: zerar volta
    // para a Identificação e desmontaria a confirmação na tela de
    // Resumo. Quem zera é o Resumo, quando o executivo fecha a
    // confirmação de sucesso. Na falha, os dados ficam para tentar de novo.
    return finalizarDia(dia, {
      repositorio: repositorioDias,
      envio: servicoEnvio,
    });
  }, [montarDiaParaSalvar]);

  const valor = useMemo<ValorContexto>(
    () => ({
      estado,
      despachar,
      totais,
      etapasVisiveis,
      fluxosFaltando,
      agenciasVisitadas,
      irParaEtapa,
      selecionarExecutivo,
      montarDiaParaSalvar,
      salvarDia,
    }),
    [
      estado,
      totais,
      etapasVisiveis,
      fluxosFaltando,
      agenciasVisitadas,
      irParaEtapa,
      selecionarExecutivo,
      montarDiaParaSalvar,
      salvarDia,
    ],
  );

  return (
    <FormularioContexto.Provider value={valor}>
      {children}
    </FormularioContexto.Provider>
  );
}

// Reexportado para quem precisar criar IDs ao montar listas locais.
export { gerarId };
