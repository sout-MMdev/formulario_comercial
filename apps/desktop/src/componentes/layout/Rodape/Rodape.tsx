// ================================================================
// RODAPÉ
// ================================================================

import { DESENVOLVEDOR, NOME_EMPRESA } from "@cativa/nucleo/config";
import "./Rodape.css";

export function Rodape() {
  return (
    <footer className="rodape">
      <p className="rodape__texto">
        {NOME_EMPRESA} &copy; {new Date().getFullYear()}
      </p>

      <p className="rodape__credito">
        Desenvolvido por <strong>{DESENVOLVEDOR}</strong>
        <span className="rodape__separador" aria-hidden="true">
          ·
        </span>
        <span className="rodape__versao">v2</span>
      </p>
    </footer>
  );
}
