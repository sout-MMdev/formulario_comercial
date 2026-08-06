// ================================================================
// BOTÃO
// Uma única porta de entrada para todo botão do sistema.
// A aparência vem das classes de estilos/compartilhado/botoes.css.
// ================================================================

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icone, type NomeIcone } from "@/componentes/ui/Icone";

export type VarianteBotao =
  | "primario"
  | "destaque"
  | "contorno"
  | "discreto"
  | "perigo"
  | "adicionar";

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  /** Ícone antes do texto. */
  icone?: NomeIcone;
  /** Ícone depois do texto — use para "avançar". */
  iconeFim?: NomeIcone;
  pequeno?: boolean;
  largo?: boolean;
  children?: ReactNode;
}

export function Botao({
  variante = "primario",
  icone,
  iconeFim,
  pequeno = false,
  largo = false,
  className = "",
  type = "button",
  children,
  ...resto
}: PropsBotao) {
  const classes = [
    "btn",
    `btn--${variante}`,
    pequeno ? "btn--pequeno" : "",
    largo ? "btn--largo" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...resto}>
      {icone && <Icone nome={icone} tamanho={pequeno ? 14 : 16} />}
      {children}
      {iconeFim && <Icone nome={iconeFim} tamanho={pequeno ? 14 : 16} />}
    </button>
  );
}
