// ================================================================
// SEÇÃO DO RESUMO
// Agrupador visual das partes do resumo (Deslocamentos, Despesas,
// Visita). Existe para que todas tenham exatamente o mesmo formato.
// ================================================================

import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "@/componentes/ui";

interface PropsSecaoResumo {
  icone: NomeIcone;
  titulo: string;
  contador?: number;
  children: ReactNode;
}

export function SecaoResumo({
  icone,
  titulo,
  contador,
  children,
}: PropsSecaoResumo) {
  return (
    <section className="resumo-secao">
      <header className="resumo-secao__cabecalho">
        <span className="resumo-secao__icone">
          <Icone nome={icone} tamanho={15} />
        </span>

        <h3 className="resumo-secao__titulo">{titulo}</h3>

        {contador !== undefined && contador > 0 && (
          <span className="etiqueta etiqueta--neutra">{contador}</span>
        )}
      </header>

      <div className="resumo-secao__corpo">{children}</div>
    </section>
  );
}

/** Linha "Rótulo .......... Valor" usada dentro dos cartões. */
export function LinhaDado({
  chave,
  valor,
}: {
  chave: string;
  valor: ReactNode;
}) {
  return (
    <div className="linha-dado">
      <span className="linha-dado__chave">{chave}</span>
      <span className="linha-dado__valor">{valor}</span>
    </div>
  );
}
