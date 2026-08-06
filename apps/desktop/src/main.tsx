// ================================================================
// PONTO DE ENTRADA
// Liga o React à página e envolve o app no provedor de estado.
// ================================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ProvedorFormulario } from "@/contexto/FormularioContexto";
import "@/estilos/index.css";

const raiz = document.getElementById("raiz");

if (!raiz) {
  throw new Error('Elemento #raiz não encontrado no index.html.');
}

createRoot(raiz).render(
  <StrictMode>
    <ProvedorFormulario>
      <App />
    </ProvedorFormulario>
  </StrictMode>,
);
