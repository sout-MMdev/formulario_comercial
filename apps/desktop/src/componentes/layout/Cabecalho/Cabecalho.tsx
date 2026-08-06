// ================================================================
// CABEÇALHO
// Faixa fixa no topo: logo, nome do relatório e, quando já houver
// executivo escolhido, quem está preenchendo.
// ================================================================

import { CAMINHO_LOGO, NOME_APP } from "@cativa/nucleo/config";
import { Icone } from "@/componentes/ui/Icone";
import "./Cabecalho.css";

interface PropsCabecalho {
  nomeExecutivo?: string;
  emailExecutivo?: string;
}

export function Cabecalho({ nomeExecutivo, emailExecutivo }: PropsCabecalho) {
  return (
    <header className="cabecalho">
      <div className="cabecalho__interno">
        <div className="cabecalho__marca">
          <img
            src={CAMINHO_LOGO}
            alt="Cativa Operadora"
            className="cabecalho__logo"
          />
          <span className="cabecalho__divisor" aria-hidden="true" />
          <span className="cabecalho__titulo">{NOME_APP}</span>
        </div>

        {nomeExecutivo && (
          <div className="cabecalho__executivo">
            <span className="cabecalho__avatar" aria-hidden="true">
              <Icone nome="usuario" tamanho={15} />
            </span>

            <span className="cabecalho__dados">
              <strong className="cabecalho__nome">{nomeExecutivo}</strong>
              {emailExecutivo && (
                <span className="cabecalho__email">{emailExecutivo}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
