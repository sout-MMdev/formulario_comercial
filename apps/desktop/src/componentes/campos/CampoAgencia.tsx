// ================================================================
// CAMPO DE AGÊNCIA
// Autocomplete sobre a base de agências (public/agencias.json).
// Aceita nome livre: agência nova ainda não cadastrada continua
// podendo ser registrada.
// ================================================================

import { useMemo } from "react";
import {
  Autocomplete,
  type SugestaoAutocomplete,
} from "@/componentes/ui/Autocomplete";
import { BUSCA_TAMANHO_MINIMO } from "@cativa/nucleo/config";
import { filtrarAgencias } from "@cativa/nucleo/servicos/agencias";

interface PropsCampoAgencia {
  id?: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  placeholder?: string;
  invalido?: boolean;
}

export function CampoAgencia({
  id,
  valor,
  aoAlterar,
  placeholder = "Nome da agência visitada",
  invalido = false,
}: PropsCampoAgencia) {
  const sugestoes = useMemo<SugestaoAutocomplete[]>(() => {
    if (valor.trim().length < BUSCA_TAMANHO_MINIMO) return [];
    return filtrarAgencias(valor).map((nome) => ({ chave: nome, rotulo: nome }));
  }, [valor]);

  return (
    <Autocomplete
      id={id}
      valor={valor}
      aoAlterar={aoAlterar}
      aoSelecionar={(sugestao) => aoAlterar(sugestao.rotulo)}
      sugestoes={sugestoes}
      placeholder={placeholder}
      icone="predio"
      invalido={invalido}
      textoVazio={
        valor.trim().length >= BUSCA_TAMANHO_MINIMO
          ? "Agência não cadastrada — pode registrar assim mesmo."
          : undefined
      }
    />
  );
}
