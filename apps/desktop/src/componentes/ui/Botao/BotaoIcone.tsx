// ================================================================
// BOTÃO DE ÍCONE
// Quadradinho só com ícone — remover linha, fechar pop-up.
// Sempre exige `rotulo` para leitores de tela.
// ================================================================

import type { ButtonHTMLAttributes } from "react";
import { Icone, type NomeIcone } from "@/componentes/ui/Icone";

interface PropsBotaoIcone extends ButtonHTMLAttributes<HTMLButtonElement> {
  icone: NomeIcone;
  /** Descrição da ação — vira aria-label e title. */
  rotulo: string;
  tamanho?: number;
}

export function BotaoIcone({
  icone,
  rotulo,
  tamanho = 16,
  className = "",
  type = "button",
  ...resto
}: PropsBotaoIcone) {
  return (
    <button
      type={type}
      className={`btn-icone ${className}`.trim()}
      aria-label={rotulo}
      title={rotulo}
      {...resto}
    >
      <Icone nome={icone} tamanho={tamanho} />
    </button>
  );
}
