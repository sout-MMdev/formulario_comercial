// ================================================================
// PASSO — QUEM ESTÁ PREENCHENDO
// Uma pergunta só. O e-mail vem preenchido e fica visível para
// conferência, mas só abre para edição se o executivo pedir —
// digitar e-mail em teclado de celular é onde mais se erra.
// ================================================================

import { useState } from "react";
import { Campo, Entrada, Selecao } from "@/componentes/ui/Campo";
import { Icone } from "@/componentes/ui/Icone";
import { TelaPasso } from "@/componentes/layout/TelaPasso";
import { executivos } from "@cativa/nucleo/config";
import { emailValido, validarIdentificacao } from "@cativa/nucleo/regras";
import { useFormulario } from "@/contexto/useFormulario";
import { PASSOS } from "@/navegacao/passos";
import "./Executivo.css";

export function Executivo() {
  const {
    estado,
    despachar,
    selecionarExecutivo,
    avancar,
    voltar,
    indicePasso,
    sequencia,
    sentido,
    temAnterior,
  } = useFormulario();

  const { identificacao } = estado;
  const [editandoEmail, setEditandoEmail] = useState(false);

  const validacao = validarIdentificacao(identificacao);

  return (
    <TelaPasso
      titulo={PASSOS.executivo.titulo}
      apoio={PASSOS.executivo.apoio}
      indice={indicePasso}
      total={sequencia.length}
      sentido={sentido}
      temVoltar={temAnterior}
      aoVoltar={voltar}
      aoAvancar={avancar}
      podeAvancar={validacao.valido}
      motivoBloqueio={validacao.erro}
    >
      <Campo rotulo="Seu nome" obrigatorio>
        {(id) => (
          <Selecao
            id={id}
            placeholder="Toque para selecionar"
            value={identificacao.nome}
            opcoes={executivos.map((executivo) => ({
              valor: executivo.valor,
              rotulo: executivo.rotulo,
            }))}
            onChange={(evento) => {
              selecionarExecutivo(evento.target.value);
              setEditandoEmail(false);
            }}
          />
        )}
      </Campo>

      {identificacao.nome && !editandoEmail && (
        <div className="email-confirmado anim-surgir">
          <span className="email-confirmado__icone">
            <Icone nome="email" tamanho={18} />
          </span>

          <span className="email-confirmado__texto">
            <span className="email-confirmado__rotulo">
              O relatório vai para
            </span>
            <strong className="email-confirmado__valor">
              {identificacao.email || "e-mail não cadastrado"}
            </strong>
          </span>

          <button
            type="button"
            className="email-confirmado__editar"
            onClick={() => setEditandoEmail(true)}
          >
            Alterar
          </button>
        </div>
      )}

      {identificacao.nome && editandoEmail && (
        <Campo
          rotulo="Seu e-mail"
          obrigatorio
          erro={
            identificacao.email && !emailValido(identificacao.email)
              ? "E-mail em formato inválido."
              : null
          }
        >
          {(id) => (
            <Entrada
              id={id}
              type="email"
              inputMode="email"
              enterKeyHint="done"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="exemplo@cativaoperadora.com.br"
              value={identificacao.email}
              invalido={
                Boolean(identificacao.email) && !emailValido(identificacao.email)
              }
              onChange={(evento) =>
                despachar({
                  tipo: "definir-identificacao",
                  dados: { email: evento.target.value },
                })
              }
              onBlur={() => {
                if (emailValido(identificacao.email)) setEditandoEmail(false);
              }}
            />
          )}
        </Campo>
      )}
    </TelaPasso>
  );
}
