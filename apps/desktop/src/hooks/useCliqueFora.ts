// ================================================================
// HOOK — useCliqueFora
// Chama a função quando o usuário clica fora do elemento.
// Usado para fechar listas suspensas (autocomplete, multiseleção).
// ================================================================

import { useEffect, type RefObject } from "react";

export function useCliqueFora(
  referencia: RefObject<HTMLElement | null>,
  aoClicarFora: () => void,
  ativo = true,
): void {
  useEffect(() => {
    if (!ativo) return;

    function tratar(evento: MouseEvent | TouchEvent) {
      const elemento = referencia.current;
      if (!elemento) return;
      if (elemento.contains(evento.target as Node)) return;
      aoClicarFora();
    }

    document.addEventListener("mousedown", tratar);
    document.addEventListener("touchstart", tratar);

    return () => {
      document.removeEventListener("mousedown", tratar);
      document.removeEventListener("touchstart", tratar);
    };
  }, [referencia, aoClicarFora, ativo]);
}
