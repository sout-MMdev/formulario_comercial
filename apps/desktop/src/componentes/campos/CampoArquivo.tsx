// ================================================================
// CAMPO DE ARQUIVO
// Área de anexo da nota fiscal. Guarda apenas o NOME do arquivo no
// estado — o binário fica no input até existir um backend para
// receber o upload.
// ================================================================

import { useRef } from "react";
import { Icone } from "@/componentes/ui/Icone";
import { BotaoIcone } from "@/componentes/ui/Botao";

interface PropsCampoArquivo {
  id?: string;
  nomeArquivo: string;
  aoAlterar: (nomeArquivo: string) => void;
  accept?: string;
  invalido?: boolean;
}

export function CampoArquivo({
  id,
  nomeArquivo,
  aoAlterar,
  accept = "image/*,.pdf",
  invalido = false,
}: PropsCampoArquivo) {
  const entrada = useRef<HTMLInputElement>(null);

  function limpar() {
    if (entrada.current) entrada.current.value = "";
    aoAlterar("");
  }

  return (
    <div
      className={[
        "campo-arquivo",
        nomeArquivo ? "campo-arquivo--preenchido" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        id={id}
        ref={entrada}
        type="file"
        className="campo-arquivo__entrada"
        accept={accept}
        onChange={(evento) => aoAlterar(evento.target.files?.[0]?.name ?? "")}
      />

      <div
        className="campo-arquivo__area"
        style={invalido && !nomeArquivo ? { borderColor: "var(--cor-erro-500)" } : undefined}
      >
        <Icone
          nome={nomeArquivo ? "sucesso" : "clipe"}
          tamanho={16}
          className="campo-arquivo__icone"
        />

        <span className="campo-arquivo__nome">
          {nomeArquivo || "Clique para anexar a foto ou o PDF da nota"}
        </span>

        {nomeArquivo && (
          <BotaoIcone
            icone="fechar"
            rotulo="Remover anexo"
            tamanho={14}
            onClick={(evento) => {
              evento.stopPropagation();
              limpar();
            }}
            style={{ marginLeft: "auto", position: "relative", zIndex: 1 }}
          />
        )}
      </div>
    </div>
  );
}
