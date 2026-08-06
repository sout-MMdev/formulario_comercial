// ================================================================
// CAMPO
// Envelope de qualquer entrada: rótulo + controle + ajuda/erro.
// Garante que todo campo do sistema tenha a mesma anatomia e que
// o <label> esteja sempre ligado ao controle certo.
// ================================================================

import { useId, type ReactNode } from "react";
import { Icone } from "@/componentes/ui/Icone";

interface PropsCampo {
  rotulo: string;
  /** Marca o asterisco e o aria-required. */
  obrigatorio?: boolean;
  /** Texto de apoio abaixo do controle. */
  ajuda?: string;
  /** Mensagem de erro — substitui a ajuda quando presente. */
  erro?: string | null;
  /** Recebe o id gerado, para ligar ao <label>. */
  children: (id: string) => ReactNode;
  className?: string;
}

export function Campo({
  rotulo,
  obrigatorio = false,
  ajuda,
  erro,
  children,
  className = "",
}: PropsCampo) {
  const id = useId();

  return (
    <div className={`campo ${className}`.trim()}>
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span className="campo__obrigatorio" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children(id)}

      {erro ? (
        <span className="campo__erro" role="alert">
          <Icone nome="alerta" tamanho={13} />
          {erro}
        </span>
      ) : (
        ajuda && <span className="campo__ajuda">{ajuda}</span>
      )}
    </div>
  );
}
