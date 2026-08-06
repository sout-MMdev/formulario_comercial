// ================================================================
// CONFIG — AGÊNCIA
// Listas usadas na aba Agências: faixas de faturamento, produtos
// e atendentes de preferência.
// ================================================================

import type { Opcao } from "../tipos/index.ts";

/** Faixas de faturamento anual da agência. */
export const faturamentoAnualOpcoes: Opcao[] = [
  { value: "10000-30000", label: "10 mil a 30 mil" },
  { value: "30000-50000", label: "30 mil a 50 mil" },
  { value: "50000-100000", label: "50 mil a 100 mil" },
  { value: "100000-250000", label: "100 mil a 250 mil" },
  { value: "250000-500000", label: "250 mil a 500 mil" },
  { value: "500000-1000000", label: "500 mil a 1.000.000 milhão" },
];

/** Produtos que a agência pode vender. */
export const produtosAgencia: string[] = [
  "Grupos com Guia",
  "Cruzeiros",
  "Turismo de Luxo",
  "Nacional",
  "Disney",
  "Europa",
  "Exóticos",
  "Caribe",
  "América do Sul",
  "Bloqueios Aéreos",
  "Grupos Fechados",
  "Corporativo",
];

/** Atendentes da Cativa que a agência pode ter como preferência. */
export const listaAtendentes: string[] = [
  "Alessandro Dias",
  "Ana Teixeira",
  "Andrea Licastro",
  "Carlos Rodriguez",
  "Claudia Correa",
  "Cristiane Pereira",
  "Flavia Velloso",
  "Isabel Garcia",
  "Janaína Mussuri",
  "Juliana Bertolini",
  "Juliana Eboli",
  "Leandro Viana",
  "Mari Drefahl",
  "Mauricio Pimenta",
  "Michele Paim",
  "Nilsa Goulart",
  "Padilha de Morais",
  "Patricia Staggemeier",
  "Paula Lessa",
  "Rafael Biguetti",
  "Renata Esteves",
  "Talitha Asquini",
];
