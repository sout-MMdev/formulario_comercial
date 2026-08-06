// ================================================================
// CAMPO DE LOCAL (mobile)
// Mesma lógica de duas fases do desktop — cidade (IBGE) e depois
// rua (ViaCEP) — só que a busca acontece em tela cheia.
//
// A troca de fase é explícita aqui: depois de escolher a cidade,
// a tela mostra a cidade fixada no topo e passa a buscar ruas.
// ================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { BuscaEmFolha, type Sugestao } from "@/componentes/ui/BuscaEmFolha";
import {
  BUSCA_TAMANHO_MINIMO,
  RUAS_DEBOUNCE_MS,
  RUAS_TAMANHO_MINIMO,
} from "@cativa/nucleo/config";
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
  /** Só cidade (sem a 2ª fase de rua): escolher a cidade já encerra e
   *  fecha a folha. Usado em Trajetos, onde só importa a cidade. */
  apenasCidade?: boolean;
}

export function CampoLocal({
  id,
  valor,
  aoAlterar,
  placeholder = "Escolher cidade",
  invalido = false,
  apenasCidade = false,
}: PropsCampoLocal) {
  const [termo, setTermo] = useState("");
  const [cidade, setCidade] = useState<Cidade | null>(null);
  const [ruas, setRuas] = useState<Rua[]>([]);
  const [buscando, setBuscando] = useState(false);

  const termoAtrasado = useDebounce(termo, RUAS_DEBOUNCE_MS);
  const requisicao = useRef(0);

  // Fase 2: com a cidade definida, o que se digita busca ruas
  useEffect(() => {
    if (!cidade) {
      setRuas([]);
      return;
    }

    if (termoAtrasado.trim().length < RUAS_TAMANHO_MINIMO) {
      setRuas([]);
      setBuscando(false);
      return;
    }

    const meuNumero = ++requisicao.current;
    setBuscando(true);

    void buscarRuas(cidade.estado, cidade.nome, termoAtrasado).then(
      (resultado) => {
        if (meuNumero !== requisicao.current) return;
        setRuas(resultado);
        setBuscando(false);
      },
    );
  }, [termoAtrasado, cidade]);

  const sugestoes = useMemo<Sugestao[]>(() => {
    if (cidade) {
      return ruas.map((rua) => ({
        chave: `${rua.cep}-${rua.rua}`,
        rotulo: rua.rua,
        detalhe: rua.bairro ? `${rua.bairro} · ${rua.cep}` : rua.cep,
      }));
    }

    if (termo.trim().length < BUSCA_TAMANHO_MINIMO) return [];

    return filtrarCidades(termo).map((c) => ({
      chave: c.label,
      rotulo: c.nome,
      detalhe: c.estado,
    }));
  }, [cidade, ruas, termo]);

  function escolher(sugestao: Sugestao) {
    // Fase 2 → grava "Rua - Bairro, Cidade - UF" e encerra
    if (cidade) {
      const rua = ruas.find((r) => `${r.cep}-${r.rua}` === sugestao.chave);
      if (!rua) return;
      aoAlterar(`${rua.label}, ${cidade.label}`);
      setCidade(null);
      setTermo("");
      setRuas([]);
      return;
    }

    // Fase 1 → escolheu a cidade
    const escolhida = filtrarCidades(termo).find(
      (c) => c.label === sugestao.chave,
    );
    if (!escolhida) return;

    aoAlterar(escolhida.label);
    setTermo("");
    // Só cidade: encerra aqui (a folha fecha ao escolher). No modo
    // completo, fixa a cidade e continua na tela para buscar a rua.
    if (!apenasCidade) setCidade(escolhida);
  }

  return (
    <BuscaEmFolha
      id={id}
      valor={valor}
      placeholder={placeholder}
      titulo={cidade ? `Rua em ${cidade.nome}` : "Buscar cidade"}
      icone="mapa"
      invalido={invalido}
      termo={termo}
      aoDigitar={setTermo}
      sugestoes={sugestoes}
      carregando={buscando}
      dica={
        cidade
          ? `Digite o nome da rua em ${cidade.nome}, ou volte para usar só a cidade.`
          : "Digite pelo menos 2 letras do nome da cidade."
      }
      vazio={
        cidade
          ? "Nenhuma rua encontrada — pode escrever livremente."
          : "Nenhuma cidade encontrada — pode escrever livremente."
      }
      aoEscolher={escolher}
      fecharAoEscolher={apenasCidade}
      aoAceitarLivre={(texto) => {
        // Digitou algo fora da lista: vale como está, somado à
        // cidade já escolhida, se houver.
        aoAlterar(cidade ? `${texto}, ${cidade.label}` : texto);
        setCidade(null);
        setTermo("");
        setRuas([]);
      }}
      aoAbrir={() => {
        setCidade(null);
        setRuas([]);
        setTermo("");
      }}
    />
  );
}
