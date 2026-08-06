// ================================================================
// ÍCONE (mobile) — wrapper fino do componente compartilhado
// (@cativa/tema/icone). Só fixa o tamanho padrão maior do mobile
// (20px, contra 18px do desktop). A lógica de verdade (mapa Flowbite
// + fallback do @cativa/tema) mora no pacote tema, valendo pros dois apps.
// ================================================================

import {
  Icone as IconeCompartilhado,
  type PropsIcone,
  type NomeIcone,
} from "@cativa/tema/icone";

export function Icone({ tamanho = 20, ...resto }: PropsIcone) {
  return <IconeCompartilhado tamanho={tamanho} {...resto} />;
}

export type { NomeIcone };
