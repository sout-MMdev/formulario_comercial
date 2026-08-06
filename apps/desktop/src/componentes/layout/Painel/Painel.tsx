// ================================================================
// PAINEL
// A "folha" branca onde cada aba é desenhada. Todas as abas usam
// este mesmo invólucro, então o espaçamento e o cabeçalho ficam
// idênticos sem ninguém precisar lembrar disso.
// ================================================================

import type { ReactNode } from "react";

interface PropsPainel {
  etiqueta?: string;
  titulo: string;
  descricao?: string;
  /** Conteúdo à direita do título (ex.: um total). */
  extra?: ReactNode;
  /** Barra de ações — fica separada por uma linha. */
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Painel({
  etiqueta,
  titulo,
  descricao,
  extra,
  acoes,
  children,
  className = "",
}: PropsPainel) {
  return (
    <section className={`painel anim-subir ${className}`.trim()}>
      <header className="painel__cabecalho">
        <div className="linha linha--entre linha-4">
          <div>
            {etiqueta && <span className="painel__etiqueta">{etiqueta}</span>}
            <h2 className="painel__titulo">{titulo}</h2>
            {descricao && <p className="painel__descricao">{descricao}</p>}
          </div>

          {extra}
        </div>
      </header>

      <div className="painel__corpo">{children}</div>

      {acoes && <div className="painel__rodape">{acoes}</div>}
    </section>
  );
}
