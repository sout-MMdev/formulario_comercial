// ================================================================
// CAMPO DE LOCAL — autocomplete em duas fases
//
//   Fase 1 (cidade): filtra a lista do IBGE que está em memória.
//                    Ao escolher, o campo vira "Curitiba - PR, ".
//   Fase 2 (rua):    o que for digitado depois da vírgula busca
//                    logradouros no ViaCEP (mín. 3 letras, com
//                    debounce para não disparar a cada tecla).
//
// Apagar a cidade volta para a fase 1 automaticamente.
// ================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  type SugestaoAutocomplete,
} from "@/componentes/ui/Autocomplete";
import { BUSCA_TAMANHO_MINIMO, RUAS_DEBOUNCE_MS, RUAS_TAMANHO_MINIMO } from "@cativa/nucleo/config";
import { filtrarCidades } from "@cativa/nucleo/servicos/ibge";
import { buscarRuas } from "@cativa/nucleo/servicos/viacep";
import { useDebounce } from "@/hooks/useDebounce";
import type { Cidade, Rua } from "@cativa/nucleo/tipos";

interface PropsCampoLocal {
  id?: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  placeholder?: string;
  invalido?: boolean;
}

export function CampoLocal({
  id,
  valor,
  aoAlterar,
  placeholder = "Digite a cidade...",
  invalido = false,
}: PropsCampoLocal) {
  // Cidade confirmada nesta sessão do campo (guia a fase 2)
  const [cidade, setCidade] = useState<Cidade | null>(null);
  const [ruas, setRuas] = useState<Rua[]>([]);
  const [buscandoRuas, setBuscandoRuas] = useState(false);

  const prefixo = cidade ? `${cidade.label}, ` : null;
  const emFaseRua = Boolean(prefixo && valor.startsWith(prefixo));

  // O texto após "Cidade - UF, " é o que se busca no ViaCEP
  const buscaRua = emFaseRua && prefixo ? valor.slice(prefixo.length) : "";
  const buscaRuaAtrasada = useDebounce(buscaRua, RUAS_DEBOUNCE_MS);

  // Descarta respostas de buscas antigas que chegaram fora de ordem
  const requisicaoAtual = useRef(0);

  useEffect(() => {
    if (!emFaseRua || !cidade) {
      setRuas([]);
      return;
    }

    if (buscaRuaAtrasada.trim().length < RUAS_TAMANHO_MINIMO) {
      setRuas([]);
      setBuscandoRuas(false);
      return;
    }

    const meuNumero = ++requisicaoAtual.current;
    setBuscandoRuas(true);

    void buscarRuas(cidade.estado, cidade.nome, buscaRuaAtrasada).then(
      (resultado) => {
        if (meuNumero !== requisicaoAtual.current) return;
        setRuas(resultado);
        setBuscandoRuas(false);
      },
    );
  }, [buscaRuaAtrasada, cidade, emFaseRua]);

  // Se o usuário apagou/alterou a cidade, sai da fase 2
  useEffect(() => {
    if (cidade && prefixo && !valor.startsWith(prefixo)) {
      setCidade(null);
      setRuas([]);
    }
  }, [valor, cidade, prefixo]);

  const sugestoes = useMemo<SugestaoAutocomplete[]>(() => {
    if (emFaseRua) {
      return ruas.map((rua) => ({
        chave: `${rua.cep}-${rua.rua}`,
        rotulo: rua.rua,
        detalhe: rua.bairro ? `${rua.bairro} · ${rua.cep}` : rua.cep,
      }));
    }

    if (valor.trim().length < BUSCA_TAMANHO_MINIMO) return [];

    return filtrarCidades(valor).map((c) => ({
      chave: c.label,
      rotulo: c.nome,
      detalhe: c.estado,
    }));
  }, [emFaseRua, ruas, valor]);

  function aoSelecionar(sugestao: SugestaoAutocomplete) {
    if (emFaseRua) {
      const rua = ruas.find((r) => `${r.cep}-${r.rua}` === sugestao.chave);
      if (!rua || !cidade) return;
      aoAlterar(`${rua.label}, ${cidade.label}`);
      setRuas([]);
      return;
    }

    const escolhida = filtrarCidades(valor).find(
      (c) => c.label === sugestao.chave,
    );
    if (!escolhida) return;

    setCidade(escolhida);
    // A vírgula sinaliza que o próximo trecho digitado é a rua
    aoAlterar(`${escolhida.label}, `);
  }

  const textoVazio = emFaseRua
    ? buscaRua.trim().length >= RUAS_TAMANHO_MINIMO && !buscandoRuas
      ? "Nenhuma rua encontrada — pode digitar livremente."
      : undefined
    : valor.trim().length >= BUSCA_TAMANHO_MINIMO
      ? "Nenhuma cidade encontrada — pode digitar livremente."
      : undefined;

  return (
    <Autocomplete
      id={id}
      valor={valor}
      aoAlterar={aoAlterar}
      aoSelecionar={aoSelecionar}
      sugestoes={sugestoes}
      placeholder={placeholder}
      icone="mapa"
      carregando={buscandoRuas}
      textoVazio={textoVazio}
      invalido={invalido}
    />
  );
}
