// ================================================================
// CAMPO DE ENDEREÇO
// O executivo digita o CEP → o ViaCEP preenche logradouro, bairro,
// cidade e UF. Número e complemento são digitados à mão (o CEP não
// os fornece). Se o CEP não for encontrado, tudo pode ser preenchido
// manualmente — o campo nunca trava.
// ================================================================

import { useEffect, useRef, useState } from "react";
import { Campo } from "@/componentes/ui/Campo";
import {
  apenasDigitosCep,
  buscarEnderecoPorCep,
} from "@cativa/nucleo/servicos/viacep";
import type { Endereco } from "@cativa/nucleo/tipos";
import "./CampoEndereco.css";

interface PropsCampoEndereco {
  valor: Endereco;
  aoAlterar: (endereco: Endereco) => void;
}

export function CampoEndereco({ valor, aoAlterar }: PropsCampoEndereco) {
  const [buscando, setBuscando] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  // Evita loops e respostas fora de ordem sem virar dependência do efeito
  const dadosRef = useRef({ valor, aoAlterar });
  dadosRef.current = { valor, aoAlterar };
  const requisicao = useRef(0);

  const digitosCep = apenasDigitosCep(valor.cep);

  // Busca automática quando o CEP fica completo (8 dígitos)
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
      // Preserva número e complemento que o executivo já tenha digitado
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
    <div className="campo-endereco">
      <Campo
        rotulo="CEP"
        ajuda={
          buscando
            ? "Buscando endereço…"
            : naoEncontrado
              ? "CEP não encontrado — preencha os campos à mão."
              : "Digite o CEP para preencher automaticamente."
        }
      >
        {(id) => (
          <input
            id={id}
            className="controle campo-endereco__cep"
            value={valor.cep}
            onChange={(evento) => alterar("cep", evento.target.value)}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
          />
        )}
      </Campo>

      <div className="grade-campos--2">
        <Campo rotulo="Logradouro">
          {(id) => (
            <input
              id={id}
              className="controle"
              value={valor.logradouro}
              onChange={(evento) => alterar("logradouro", evento.target.value)}
              placeholder="Rua, avenida…"
            />
          )}
        </Campo>
        <Campo rotulo="Número">
          {(id) => (
            <input
              id={id}
              className="controle"
              value={valor.numero}
              onChange={(evento) => alterar("numero", evento.target.value)}
              placeholder="123"
              inputMode="numeric"
            />
          )}
        </Campo>
      </div>

      <div className="grade-campos--2">
        <Campo rotulo="Bairro">
          {(id) => (
            <input
              id={id}
              className="controle"
              value={valor.bairro}
              onChange={(evento) => alterar("bairro", evento.target.value)}
              placeholder="Bairro"
            />
          )}
        </Campo>
        <Campo rotulo="Complemento">
          {(id) => (
            <input
              id={id}
              className="controle"
              value={valor.complemento}
              onChange={(evento) => alterar("complemento", evento.target.value)}
              placeholder="Sala, andar… (opcional)"
            />
          )}
        </Campo>
      </div>

      <div className="grade-campos--2">
        <Campo rotulo="Cidade">
          {(id) => (
            <input
              id={id}
              className="controle"
              value={valor.cidade}
              onChange={(evento) => alterar("cidade", evento.target.value)}
              placeholder="Cidade"
            />
          )}
        </Campo>
        <Campo rotulo="UF">
          {(id) => (
            <input
              id={id}
              className="controle campo-endereco__uf"
              value={valor.uf}
              onChange={(evento) =>
                alterar("uf", evento.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="UF"
              maxLength={2}
            />
          )}
        </Campo>
      </div>
    </div>
  );
}
