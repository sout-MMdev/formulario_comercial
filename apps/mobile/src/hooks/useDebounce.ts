// ================================================================
// HOOK — useDebounce
// Devolve o valor só depois que ele para de mudar por X ms.
// No celular importa ainda mais: cada requisição a mais é bateria
// e dado móvel gastos à toa.
// ================================================================

import { useEffect, useState } from "react";

export function useDebounce<T>(valor: T, atrasoMs: number): T {
  const [valorAtrasado, setValorAtrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorAtrasado(valor), atrasoMs);
    return () => clearTimeout(temporizador);
  }, [valor, atrasoMs]);

  return valorAtrasado;
}
