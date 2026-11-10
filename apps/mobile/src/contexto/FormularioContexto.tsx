// ================================================================
// CONTEXTO DO FORMULÁRIO — APP MOBILE
//
// Usa o MESMO reducer do desktop (@cativa/nucleo/estado): as
// transições de dado são idênticas nos dois apps. O que este
// contexto acrescenta é a navegação por passos, que só existe aqui.
// ================================================================

import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  estadoInicial,
  formularioReducer,
  type AcaoFormulario,
  type EstadoFormulario,
} from "@cativa/nucleo/estado";
import { emailDoExecutivo } from "@cativa/nucleo/servicos/executivos";
import {
  calcularTotaisDia,
  obterFluxosFaltando,
} from "@cativa/nucleo/regras";
import { repositorioDias } from "@cativa/nucleo/servicos/armazenamento";
import {
  finalizarDia,
  servicoEnvio,
  type ResultadoEnvio,
} from "@cativa/nucleo/servicos/envio";
import type { DiaSalvo, NomeFluxo, TotaisDia } from "@cativa/nucleo/tipos";
import { limparLocal } from "@cativa/nucleo/utils";
import { montarSequencia, type NomePasso } from "@/navegacao/passos";

/** Sentido da última navegação — comanda a direção da animação. */
export type SentidoNavegacao = "avancar" | "voltar";

interface ValorContexto {
  estado: EstadoFormulario;
  despachar: React.Dispatch<AcaoFormulario>;

  // Derivados
  totais: TotaisDia;
  fluxosFaltando: NomeFluxo[];
  agenciasVisitadas: string[];

  // Navegação por passos
  passo: NomePasso;
  sequencia: NomePasso[];
  indicePasso: number;
  sentido: SentidoNavegacao;
  temAnterior: boolean;
  avancar: () => void;
  voltar: () => void;
  irParaPasso: (passo: NomePasso) => void;

  // Atalhos
  selecionarExecutivo: (nome: string) => void;
  escolherRelatorio: (fluxo: NomeFluxo) => void;
  adicionarRelatorio: (fluxo: NomeFluxo) => void;
  salvarDia: () => Promise<ResultadoEnvio>;
  /** Depois de um envio aceito: zera o dia e volta ao primeiro passo. */
  comecarOutroDia: () => void;
}

export const FormularioContexto = createContext<ValorContexto | null>(null);

export function ProvedorFormulario({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(formularioReducer, estadoInicial);
  const [passo, setPasso] = useState<NomePasso>("executivo");
  const [sentido, setSentido] = useState<SentidoNavegacao>("avancar");

  // ── Derivados ──────────────────────────────────────────────────

  const totais = useMemo(
    () => calcularTotaisDia(estado.trajetos, estado.despesas),
    [estado.trajetos, estado.despesas],
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

  const sequencia = useMemo(
    () => montarSequencia(estado.fluxosAdicionados),
    [estado.fluxosAdicionados],
  );

  const indicePasso = sequencia.indexOf(passo);

  // ── Navegação ──────────────────────────────────────────────────

  const irParaPasso = useCallback(
    (destino: NomePasso) => {
      const atual = sequencia.indexOf(passo);
      const alvo = sequencia.indexOf(destino);
      setSentido(alvo < atual ? "voltar" : "avancar");
      setPasso(destino);
      window.scrollTo({ top: 0 });
    },
    [passo, sequencia],
  );

  const avancar = useCallback(() => {
    const proximo = sequencia[sequencia.indexOf(passo) + 1];
    if (!proximo) return;

    // A aba Agências do desktop monta seus blocos ao ser aberta;
    // aqui o gatilho é o mesmo, só que ao entrar no passo "analise".
    if (proximo === "analise") {
      despachar({ tipo: "sincronizar-agencias" });
    }

    setSentido("avancar");
    setPasso(proximo);
    window.scrollTo({ top: 0 });
  }, [passo, sequencia]);

  const voltar = useCallback(() => {
    const anterior = sequencia[sequencia.indexOf(passo) - 1];
    if (!anterior) return;
    setSentido("voltar");
    setPasso(anterior);
    window.scrollTo({ top: 0 });
  }, [passo, sequencia]);

  // ── Atalhos ────────────────────────────────────────────────────

  const selecionarExecutivo = useCallback((nome: string) => {
    despachar({
      tipo: "definir-identificacao",
      dados: { nome, email: emailDoExecutivo(nome) },
    });
  }, []);

  /** Escolhe o relatório e já entra no primeiro passo dele. */
  const escolherRelatorio = useCallback((fluxo: NomeFluxo) => {
    despachar({ tipo: "escolher-fluxo", fluxo });
    setSentido("avancar");
    setPasso(fluxo === "visita" ? "data-visita" : "trajetos");
    window.scrollTo({ top: 0 });
  }, []);

  /** Adiciona o outro relatório ao mesmo dia, a partir do resumo. */
  const adicionarRelatorio = useCallback((fluxo: NomeFluxo) => {
    despachar({ tipo: "adicionar-fluxo", fluxo });
    setSentido("avancar");
    setPasso(fluxo === "visita" ? "data-visita" : "trajetos");
    window.scrollTo({ top: 0 });
  }, []);

  const salvarDia = useCallback(async () => {
    const dia: DiaSalvo = {
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
      agenciasComercial: estado.agenciasComercial.map((a) => ({ ...a })),
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

    // Envia ao CRM (+ cópia por e-mail); a cópia local só é gravada se
    // o envio foi aceito. O formulário NÃO é zerado aqui: o passo de
    // Resumo mostra a confirmação e chama comecarOutroDia() quando o
    // executivo a fecha. Na falha, os dados ficam para tentar de novo.
    return finalizarDia(dia, {
      repositorio: repositorioDias,
      envio: servicoEnvio,
    });
  }, [estado, agenciasVisitadas]);

  /** Zera o dia (mantém o executivo) e volta ao primeiro passo. */
  const comecarOutroDia = useCallback(() => {
    despachar({ tipo: "reiniciar" });
    setPasso("executivo");
    setSentido("avancar");
  }, []);

  const valor = useMemo<ValorContexto>(
    () => ({
      estado,
      despachar,
      totais,
      fluxosFaltando,
      agenciasVisitadas,
      passo,
      sequencia,
      indicePasso,
      sentido,
      temAnterior: indicePasso > 0,
      avancar,
      voltar,
      irParaPasso,
      selecionarExecutivo,
      escolherRelatorio,
      adicionarRelatorio,
      salvarDia,
      comecarOutroDia,
    }),
    [
      estado,
      totais,
      fluxosFaltando,
      agenciasVisitadas,
      passo,
      sequencia,
      indicePasso,
      sentido,
      avancar,
      voltar,
      irParaPasso,
      selecionarExecutivo,
      escolherRelatorio,
      adicionarRelatorio,
      salvarDia,
      comecarOutroDia,
    ],
  );

  return (
    <FormularioContexto.Provider value={valor}>
      {children}
    </FormularioContexto.Provider>
  );
}
