// ================================================================
// CAMPO DE AGÊNCIA (mobile)
// Busca em tela cheia sobre a base de agências. Aceita nome livre:
// agência ainda não cadastrada continua podendo ser registrada.
// ================================================================

import { useMemo, useState } from "react";
import { BuscaEmFolha, type Sugestao } from "@/componentes/ui/BuscaEmFolha";
import { BUSCA_TAMANHO_MINIMO } from "@cativa/nucleo/config";
import { filtrarAgencias } from "@cativa/nucleo/servicos/agencias";

interface PropsCampoAgencia {
  id?: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  invalido?: boolean;
}

export function CampoAgencia({
  id,
  valor,
  aoAlterar,
  invalido = false,
}: PropsCampoAgencia) {
  const [termo, setTermo] = useState("");

  const sugestoes = useMemo<Sugestao[]>(() => {
    if (termo.trim().length < BUSCA_TAMANHO_MINIMO) return [];
    return filtrarAgencias(termo).map((nome) => ({ chave: nome, rotulo: nome }));
  }, [termo]);

  return (
    <BuscaEmFolha
      id={id}
      valor={valor}
      placeholder="Escolher agência"
      titulo="Buscar agência"
      icone="predio"
      invalido={invalido}
      termo={termo}
      aoDigitar={setTermo}
      sugestoes={sugestoes}
      dica="Digite pelo menos 2 letras do nome da agência."
      vazio="Agência não cadastrada — pode registrar assim mesmo."
      aoEscolher={(sugestao) => {
        aoAlterar(sugestao.rotulo);
        setTermo("");
      }}
      aoAceitarLivre={(texto) => {
        aoAlterar(texto);
        setTermo("");
      }}
      aoAbrir={() => setTermo("")}
    />
  );
}
