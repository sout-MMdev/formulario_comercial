// ================================================================
// BOTÕES (mobile)
// Altura 56px por padrão. O botão de ícone nunca fica abaixo de
// 44px — é o mínimo em que o dedo acerta com segurança.
// ================================================================

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icone, type NomeIcone } from "./Icone";

type Variante = "primario" | "destaque" | "contorno" | "discreto" | "adicionar";

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  icone?: NomeIcone;
  iconeFim?: NomeIcone;
  menor?: boolean;
  largo?: boolean;
  children?: ReactNode;
}

export function Botao({
  variante = "primario",
  icone,
  iconeFim,
  menor = false,
  largo = false,
  className = "",
  type = "button",
  children,
  ...resto
}: PropsBotao) {
  const classes = [
    "btn",
    `btn--${variante}`,
    menor ? "btn--menor" : "",
    largo ? "btn--largo" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...resto}>
      {icone && <Icone nome={icone} tamanho={menor ? 16 : 18} />}
      {children}
      {iconeFim && <Icone nome={iconeFim} tamanho={menor ? 16 : 18} />}
    </button>
  );
}

interface PropsBotaoIcone extends ButtonHTMLAttributes<HTMLButtonElement> {
  icone: NomeIcone;
  rotulo: string;
  perigo?: boolean;
  tamanho?: number;
}

export function BotaoIcone({
  icone,
  rotulo,
  perigo = false,
  tamanho = 18,
  className = "",
  type = "button",
  ...resto
}: PropsBotaoIcone) {
  return (
    <button
      type={type}
      className={`btn-icone ${perigo ? "btn-icone--perigo" : ""} ${className}`.trim()}
      aria-label={rotulo}
      title={rotulo}
      {...resto}
    >
      <Icone nome={icone} tamanho={tamanho} />
    </button>
  );
}
