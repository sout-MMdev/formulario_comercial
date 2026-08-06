// ================================================================
// HOOK — CARGA INICIAL
// Orquestra o que precisa estar em memória antes do formulário
// abrir. Cada etapa tem peso no progresso e um limite de tempo.
//
// A barra é o MENOR entre dois valores:
//   • progresso real   — quantas etapas já terminaram;
//   • progresso do tempo — quanto já passou da duração mínima.
//
// Assim ela nunca mente (não passa na frente do carregamento) nem
// pisca (não salta para 100% em 300ms). Quem terminar por último
// manda: rede lenta segura a tela, rede rápida respeita o piso.
//
// Para carregar uma base nova no futuro, acrescente uma entrada
// em ETAPAS — a barra e as mensagens se ajustam sozinhas.
// ================================================================

import { useEffect, useMemo, useState } from "react";
import {
  SPLASH_DURACAO_MINIMA_MS,
  TIMEOUT_AGENCIAS_MS,
  TIMEOUT_CIDADES_MS,
} from "@cativa/nucleo/config";
import { carregarAgencias } from "@cativa/nucleo/servicos/agencias";
import { carregarCidades } from "@cativa/nucleo/servicos/ibge";

interface EtapaCarga {
  mensagem: string;
  executar: () => Promise<void>;
  limiteMs: number;
}

const ETAPAS: EtapaCarga[] = [
  {
    mensagem: "Carregando base de agências...",
    executar: carregarAgencias,
    limiteMs: TIMEOUT_AGENCIAS_MS,
  },
  {
    mensagem: "Carregando municípios do IBGE...",
    executar: carregarCidades,
    limiteMs: TIMEOUT_CIDADES_MS,
  },
];

/** Fatia da barra reservada às etapas; o resto é o arremate final. */
const PESO_ETAPAS = 92;

/** De quanto em quanto tempo a barra é redesenhada. */
const INTERVALO_TICK_MS = 60;

/** Resolve mesmo que a promessa estoure o tempo — nunca trava a tela. */
function comLimite(promessa: Promise<void>, ms: number): Promise<void> {
  return Promise.race([
    promessa,
    new Promise<void>((resolver) => setTimeout(resolver, ms)),
  ]);
}

export function usarCargaInicial() {
  // Quantas etapas já terminaram
  const [etapasConcluidas, setEtapasConcluidas] = useState(0);
  // Fração da duração mínima já decorrida (0 a 100)
  const [progressoTempo, setProgressoTempo] = useState(0);

  const tudoCarregado = etapasConcluidas === ETAPAS.length;

  // ── Relógio da duração mínima ────────────────────────────────
  useEffect(() => {
    const inicio = Date.now();

    const relogio = setInterval(() => {
      const fracao = Math.min(
        1,
        (Date.now() - inicio) / SPLASH_DURACAO_MINIMA_MS,
      );

      setProgressoTempo(fracao * 100);
      if (fracao >= 1) clearInterval(relogio);
    }, INTERVALO_TICK_MS);

    return () => clearInterval(relogio);
  }, []);

  // ── Carregamento das bases ───────────────────────────────────
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      for (const etapa of ETAPAS) {
        if (!ativo) return;
        await comLimite(etapa.executar(), etapa.limiteMs);
        if (!ativo) return;
        setEtapasConcluidas((quantas) => quantas + 1);
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  // ── O que a tela mostra ──────────────────────────────────────
  const progressoReal = (etapasConcluidas / ETAPAS.length) * PESO_ETAPAS;
  const progresso = Math.round(Math.min(progressoReal, progressoTempo));

  const pronto = tudoCarregado && progressoTempo >= 100;

  const mensagem = useMemo(() => {
    if (pronto) return "Tudo pronto!";

    // A mensagem acompanha a barra: qual etapa a barra está cruzando
    const fatia = PESO_ETAPAS / ETAPAS.length;
    const indice = Math.floor(progresso / fatia);

    return ETAPAS[indice]?.mensagem ?? "Preparando o formulário...";
  }, [progresso, pronto]);

  return { progresso, mensagem, pronto };
}
