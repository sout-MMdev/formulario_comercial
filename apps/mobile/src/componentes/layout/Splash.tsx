// ================================================================
// SPLASH (mobile)
// Mesma mecânica do desktop: a barra mostra o MENOR entre o
// carregamento real e o tempo mínimo decorrido. Nunca mente, nunca
// pisca. A duração mínima vem de @cativa/nucleo/config, então é a
// mesma nos dois apps.
// ================================================================

import { useEffect, useRef, useState } from "react";
import {
  CAMINHO_LOGO,
  NOME_APP,
  NOME_EMPRESA,
  SPLASH_DURACAO_MINIMA_MS,
  TIMEOUT_AGENCIAS_MS,
  TIMEOUT_CIDADES_MS,
} from "@cativa/nucleo/config";
import { carregarAgencias } from "@cativa/nucleo/servicos/agencias";
import { carregarCidades } from "@cativa/nucleo/servicos/ibge";
import "./Splash.css";

const ETAPAS = [
  {
    mensagem: "Carregando agências...",
    executar: carregarAgencias,
    limiteMs: TIMEOUT_AGENCIAS_MS,
  },
  {
    mensagem: "Carregando municípios...",
    executar: carregarCidades,
    limiteMs: TIMEOUT_CIDADES_MS,
  },
];

const PESO_ETAPAS = 92;

function comLimite(promessa: Promise<void>, ms: number): Promise<void> {
  return Promise.race([
    promessa,
    new Promise<void>((resolver) => setTimeout(resolver, ms)),
  ]);
}

interface PropsSplash {
  aoConcluir: () => void;
}

export function Splash({ aoConcluir }: PropsSplash) {
  const [concluidas, setConcluidas] = useState(0);
  const [progressoTempo, setProgressoTempo] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const jaAvisou = useRef(false);

  // Relógio da duração mínima
  useEffect(() => {
    const inicio = Date.now();
    const relogio = setInterval(() => {
      const fracao = Math.min(
        1,
        (Date.now() - inicio) / SPLASH_DURACAO_MINIMA_MS,
      );
      setProgressoTempo(fracao * 100);
      if (fracao >= 1) clearInterval(relogio);
    }, 60);
    return () => clearInterval(relogio);
  }, []);

  // Carregamento das bases
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      for (const etapa of ETAPAS) {
        if (!ativo) return;
        await comLimite(etapa.executar(), etapa.limiteMs);
        if (!ativo) return;
        setConcluidas((n) => n + 1);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const progressoReal = (concluidas / ETAPAS.length) * PESO_ETAPAS;
  const progresso = Math.round(Math.min(progressoReal, progressoTempo));
  const pronto = concluidas === ETAPAS.length && progressoTempo >= 100;

  const mensagem = pronto
    ? "Tudo pronto!"
    : (ETAPAS[Math.floor(progresso / (PESO_ETAPAS / ETAPAS.length))]?.mensagem ??
      "Preparando...");

  useEffect(() => {
    if (!pronto || jaAvisou.current) return;
    jaAvisou.current = true;

    const paraSair = setTimeout(() => setSaindo(true), 250);
    const paraAvisar = setTimeout(aoConcluir, 800);

    return () => {
      clearTimeout(paraSair);
      clearTimeout(paraAvisar);
    };
  }, [pronto, aoConcluir]);

  return (
    <div className={`splash ${saindo ? "splash--saindo" : ""}`.trim()}>
      <div className="splash__conteudo">
        <img src={CAMINHO_LOGO} alt={NOME_EMPRESA} className="splash__logo" />
        <span className="splash__risco" />
        <p className="splash__titulo">{NOME_APP}</p>

        <div
          className="splash__barra"
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className="splash__barra-preenchida"
            style={{ width: `${progresso}%` }}
          />
        </div>

        <p className="splash__status">{mensagem}</p>
      </div>

      <p className="splash__rodape">
        {NOME_EMPRESA} &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
