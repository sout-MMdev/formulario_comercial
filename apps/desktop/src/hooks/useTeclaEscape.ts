// ================================================================
// HOOK — useTeclaEscape
// Executa uma ação quando o usuário pressiona Esc.
// ================================================================

import { useEffect } from "react";

export function useTeclaEscape(aoPressionar: () => void, ativo = true): void {
  useEffect(() => {
    if (!ativo) return;

    function tratar(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoPressionar();
    }

    document.addEventListener("keydown", tratar);
    return () => document.removeEventListener("keydown", tratar);
  }, [aoPressionar, ativo]);
}
