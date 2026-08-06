// ================================================================
// SPLASH
// Tela de abertura enquanto as bases externas carregam (agências
// do JSON local, municípios do IBGE).
//
// A barra reflete o progresso REAL: cada etapa concluída avança.
// Se uma API demorar além do limite, a tela libera assim mesmo —
// os campos passam a funcionar como texto livre em vez de travar
// o executivo.
// ================================================================

import { useEffect, useRef, useState } from "react";
import { CAMINHO_LOGO, NOME_APP, NOME_EMPRESA } from "@cativa/nucleo/config";
import { usarCargaInicial } from "./usarCargaInicial";
import "./Splash.css";

interface PropsSplash {
  /** Chamado uma única vez, quando a animação de saída termina. */
  aoConcluir: () => void;
}

export function Splash({ aoConcluir }: PropsSplash) {
  const { progresso, mensagem, pronto } = usarCargaInicial();
  const [saindo, setSaindo] = useState(false);
  const jaAvisou = useRef(false);

  useEffect(() => {
    if (!pronto || jaAvisou.current) return;
    jaAvisou.current = true;

    // Um respiro curto para o "Tudo pronto!" ser lido, e então o
    // fade. A duração mínima já foi cumprida em usarCargaInicial —
    // aqui não se espera de novo, só se conclui.
    const paraSair = setTimeout(() => setSaindo(true), 250);
    const paraAvisar = setTimeout(aoConcluir, 850);

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
