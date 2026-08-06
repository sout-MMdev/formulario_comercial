// ================================================================
// HOOK — acesso ao contexto do formulário.
// Falha alto e claro se for usado fora do provedor.
// ================================================================

import { useContext } from "react";
import { FormularioContexto } from "./FormularioContexto";

export function useFormulario() {
  const contexto = useContext(FormularioContexto);

  if (!contexto) {
    throw new Error(
      "useFormulario precisa estar dentro de <ProvedorFormulario>.",
    );
  }

  return contexto;
}
