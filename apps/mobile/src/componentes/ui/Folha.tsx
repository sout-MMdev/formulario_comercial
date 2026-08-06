// ================================================================
// FOLHA (bottom sheet)
// O equivalente mobile do modal do desktop: sobe de baixo, ocupa a
// largura toda e fica ao alcance do polegar. Tem alça de arraste,
// fecha no toque fora e respeita a safe area do aparelho.
//
// É usada pelo seletor de data, pela multisseleção, pelos editores
// de trajeto/despesa e pelo pop-up do termômetro.
// ================================================================

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BotaoIcone } from "./Botao";
import "./Folha.css";

interface PropsFolha {
  aberta: boolean;
  titulo: string;
  etiqueta?: string;
  aoFechar: () => void;
  /** Falso = só sai pelo botão de ação (pop-up que precisa ser lido). */
  permiteFecharPorFora?: boolean;
  /** Ocupa quase a tela toda — para editores com muitos campos. */
  alta?: boolean;
  rodape?: ReactNode;
  children: ReactNode;
}

export function Folha({
  aberta,
  titulo,
  etiqueta,
  aoFechar,
  permiteFecharPorFora = true,
  alta = false,
  rodape,
  children,
}: PropsFolha) {
  // Trava a rolagem do fundo — sem isso o conteúdo de trás rola
  // junto quando o dedo passa da borda da folha.
  useEffect(() => {
    if (!aberta) return;
    document.body.classList.add("com-folha-aberta");
    return () => document.body.classList.remove("com-folha-aberta");
  }, [aberta]);

  useEffect(() => {
    if (!aberta || !permiteFecharPorFora) return;

    function tratar(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }

    document.addEventListener("keydown", tratar);
    return () => document.removeEventListener("keydown", tratar);
  }, [aberta, permiteFecharPorFora, aoFechar]);

  if (!aberta) return null;

  return createPortal(
    <div
      className="folha-fundo"
      onMouseDown={(evento) => {
        if (!permiteFecharPorFora) return;
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div
        className={`folha ${alta ? "folha--alta" : ""}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        {permiteFecharPorFora && <span className="folha__alca" aria-hidden="true" />}

        <header className="folha__cabecalho">
          <div className="folha__titulos">
            {etiqueta && <span className="folha__etiqueta">{etiqueta}</span>}
            <h2 className="folha__titulo">{titulo}</h2>
          </div>

          {permiteFecharPorFora && (
            <BotaoIcone icone="fechar" rotulo="Fechar" onClick={aoFechar} />
          )}
        </header>

        <div className="folha__corpo rolagem-suave">{children}</div>

        {rodape && <footer className="folha__rodape">{rodape}</footer>}
      </div>
    </div>,
    document.body,
  );
}
