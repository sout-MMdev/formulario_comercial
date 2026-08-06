// ================================================================
// CAMPO DE ENDEREÇO (mobile)
// Digita o CEP → o ViaCEP preenche logradouro, bairro, cidade e UF.
// Número e complemento são digitados à mão. Campos empilhados, no
// jeito do celular. Se o CEP não existir, tudo pode ser digitado.
// ================================================================

import { useEffect, useRef, useState } from "react";
import { Campo, Entrada } from "@/componentes/ui/Campo";
import {
  apenasDigitosCep,
  buscarEnderecoPorCep,
} from "@cativa/nucleo/servicos/viacep";
import type { Endereco } from "@cativa/nucleo/tipos";

interface PropsCampoEndereco {
  valor: Endereco;
  aoAlterar: (endereco: Endereco) => void;
}

export function CampoEndereco({ valor, aoAlterar }: PropsCampoEndereco) {
  const [buscando, setBuscando] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const dadosRef = useRef({ valor, aoAlterar });
  dadosRef.current = { valor, aoAlterar };
  const requisicao = useRef(0);

  const digitosCep = apenasDigitosCep(valor.cep);

  useEffect(() => {
    if (digitosCep.length !== 8) {
      setNaoEncontrado(false);
      return;
    }

    const meuNumero = ++requisicao.current;
    setBuscando(true);
    setNaoEncontrado(false);

    void buscarEnderecoPorCep(digitosCep).then((encontrado) => {
      if (meuNumero !== requisicao.current) return;
      setBuscando(false);
      if (!encontrado) {
        setNaoEncontrado(true);
        return;
      }
      const atual = dadosRef.current.valor;
      dadosRef.current.aoAlterar({
        ...encontrado,
        numero: atual.numero,
        complemento: atual.complemento,
      });
    });
  }, [digitosCep]);

  function alterar(campo: keyof Endereco, novo: string) {
    aoAlterar({ ...valor, [campo]: novo });
  }

  return (
    <>
      <Campo
        rotulo="CEP"
        ajuda={
          buscando
            ? "Buscando endereço…"
            : naoEncontrado
              ? "CEP não encontrado — preencha à mão."
              : "Digite o CEP para preencher automaticamente."
        }
      >
        {(id) => (
          <Entrada
            id={id}
            value={valor.cep}
            onChange={(evento) => alterar("cep", evento.target.value)}
            placeholder="00000-000"
            inputMode="numeric"
            enterKeyHint="done"
            maxLength={9}
          />
        )}
      </Campo>

      <Campo rotulo="Logradouro">
        {(id) => (
          <Entrada
            id={id}
            value={valor.logradouro}
            onChange={(evento) => alterar("logradouro", evento.target.value)}
            placeholder="Rua, avenida…"
          />
        )}
      </Campo>

      <Campo rotulo="Número">
        {(id) => (
          <Entrada
            id={id}
            value={valor.numero}
            onChange={(evento) => alterar("numero", evento.target.value)}
            placeholder="123"
            inputMode="numeric"
          />
        )}
      </Campo>

      <Campo rotulo="Complemento">
        {(id) => (
          <Entrada
            id={id}
            value={valor.complemento}
            onChange={(evento) => alterar("complemento", evento.target.value)}
            placeholder="Sala, andar… (opcional)"
          />
        )}
      </Campo>

      <Campo rotulo="Bairro">
        {(id) => (
          <Entrada
            id={id}
            value={valor.bairro}
            onChange={(evento) => alterar("bairro", evento.target.value)}
            placeholder="Bairro"
          />
        )}
      </Campo>

      <Campo rotulo="Cidade">
        {(id) => (
          <Entrada
            id={id}
            value={valor.cidade}
            onChange={(evento) => alterar("cidade", evento.target.value)}
            placeholder="Cidade"
          />
        )}
      </Campo>

      <Campo rotulo="UF">
        {(id) => (
          <Entrada
            id={id}
            value={valor.uf}
            onChange={(evento) =>
              alterar("uf", evento.target.value.toUpperCase().slice(0, 2))
            }
            placeholder="UF"
            maxLength={2}
          />
        )}
      </Campo>
    </>
  );
}
