// ================================================================
// CAMPO DE ARQUIVO (mobile)
// A nota fiscal costuma ser fotografada na hora. Por isso são dois
// caminhos explícitos: "Tirar foto" (abre a câmera direto, via
// atributo capture) e "Escolher arquivo" (galeria ou PDF).
//
// Guarda apenas o NOME do arquivo no estado, igual ao desktop —
// o binário fica no input até existir backend para o upload.
// ================================================================

import { useRef } from "react";
import { Icone } from "@/componentes/ui/Icone";
import { BotaoIcone } from "@/componentes/ui/Botao";
import "./CampoArquivo.css";

interface PropsCampoArquivo {
  id?: string;
  nomeArquivo: string;
  aoAlterar: (nomeArquivo: string) => void;
  invalido?: boolean;
}

export function CampoArquivo({
  id,
  nomeArquivo,
  aoAlterar,
  invalido = false,
}: PropsCampoArquivo) {
  const camera = useRef<HTMLInputElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  function limpar() {
    if (camera.current) camera.current.value = "";
    if (arquivo.current) arquivo.current.value = "";
    aoAlterar("");
  }

  // Já anexado: mostra o comprovante e o botão de remover
  if (nomeArquivo) {
    return (
      <div className="anexo anexo--pronto">
        <span className="anexo__icone">
          <Icone nome="sucesso" tamanho={20} />
        </span>

        <span className="anexo__nome">{nomeArquivo}</span>

        <BotaoIcone
          icone="lixeira"
          rotulo="Remover anexo"
          perigo
          onClick={limpar}
        />
      </div>
    );
  }

  return (
    <div className={`anexo-acoes ${invalido ? "anexo-acoes--invalido" : ""}`.trim()}>
      {/* capture="environment" abre a câmera traseira direto */}
      <label className="anexo-acao">
        <input
          id={id}
          ref={camera}
          type="file"
          className="anexo-acao__entrada"
          accept="image/*"
          capture="environment"
          onChange={(evento) => aoAlterar(evento.target.files?.[0]?.name ?? "")}
        />
        <Icone nome="camera" tamanho={22} />
        Tirar foto
      </label>

      <label className="anexo-acao">
        <input
          ref={arquivo}
          type="file"
          className="anexo-acao__entrada"
          accept="image/*,.pdf"
          onChange={(evento) => aoAlterar(evento.target.files?.[0]?.name ?? "")}
        />
        <Icone nome="clipe" tamanho={22} />
        Escolher arquivo
      </label>
    </div>
  );
}
