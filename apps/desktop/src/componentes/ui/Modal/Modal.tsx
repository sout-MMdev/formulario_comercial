// ================================================================
// MODAL
// Pop-up centralizado com fundo escurecido. Trava a rolagem da
// página, fecha no Esc (quando permitido) e devolve o foco.
// Usado pelo seletor de data e pelo pop-up do termômetro.
// ================================================================

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BotaoIcone } from "@/componentes/ui/Botao";
import { useTeclaEscape } from "@/hooks/useTeclaEscape";
import "./Modal.css";

interface PropsModal {
  aberto: boolean;
  titulo: string;
  /** Etiqueta pequena acima do título. */
  etiqueta?: string;
  aoFechar: () => void;
  /**
   * Quando falso, o modal só sai pelo botão de ação — usado no
   * pop-up explicativo do termômetro, que precisa ser lido.
   */
  permiteFecharPorFora?: boolean;
  /** Barra de botões no rodapé. */
  rodape?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Modal({
  aberto,
  titulo,
  etiqueta,
  aoFechar,
  permiteFecharPorFora = true,
  rodape,
  children,
  className = "",
}: PropsModal) {
  // Trava a rolagem do fundo enquanto o modal está aberto
  useEffect(() => {
    if (!aberto) return;
    document.body.classList.add("com-modal-aberto");
    return () => document.body.classList.remove("com-modal-aberto");
  }, [aberto]);

  useTeclaEscape(aoFechar, aberto && permiteFecharPorFora);

  if (!aberto) return null;

  return createPortal(
    <div
      className="modal-fundo"
      onMouseDown={(evento) => {
        if (!permiteFecharPorFora) return;
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <header className="modal__cabecalho">
          <div className="modal__titulos">
            {etiqueta && <span className="modal__etiqueta">{etiqueta}</span>}
            <h3 className="modal__titulo">{titulo}</h3>
          </div>

          {permiteFecharPorFora && (
            <BotaoIcone icone="fechar" rotulo="Fechar" onClick={aoFechar} />
          )}
        </header>

        <div className="modal__corpo rolagem-fina">{children}</div>

        {rodape && <footer className="modal__rodape">{rodape}</footer>}
      </div>
    </div>,
    document.body,
  );
}
