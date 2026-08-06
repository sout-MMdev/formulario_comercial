// ================================================================
// TERMÔMETRO (mobile)
// Mesmo fluxo e as mesmas validações do desktop — a diferença é o
// formato: níveis empilhados em botões grandes e o pop-up
// explicativo como folha (que continua só saindo pelo "Entendi").
// ================================================================

import { useState } from "react";
import { AreaTexto } from "@/componentes/ui/Campo";
import { Botao, BotaoIcone } from "@/componentes/ui/Botao";
import { Icone } from "@/componentes/ui/Icone";
import { Folha } from "@/componentes/ui/Folha";
import {
  CLASSE_NIVEL_ESTRESSE,
  niveisEstresse,
  setoresEstresse,
} from "@cativa/nucleo/config";
import { exigeDescricao, validarRegistroEstresse } from "@cativa/nucleo/regras";
import { gerarId } from "@cativa/nucleo/utils";
import type {
  NomeNivelEstresse,
  RegistroEstresse,
} from "@cativa/nucleo/tipos";

interface PropsTermometro {
  registros: RegistroEstresse[];
  aoAlterar: (registros: RegistroEstresse[]) => void;
}

export function Termometro({ registros, aoAlterar }: PropsTermometro) {
  const [nivelNoPopup, setNivelNoPopup] = useState<NomeNivelEstresse | null>(
    null,
  );
  const [nivel, setNivel] = useState<NomeNivelEstresse | "">("");
  const [setores, setSetores] = useState<string[]>([]);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const definicaoNoPopup = niveisEstresse.find((n) => n.nome === nivelNoPopup);
  const precisaDescricao = exigeDescricao(nivel);

  function limpar() {
    setNivel("");
    setSetores([]);
    setDescricao("");
    setErro(null);
  }

  function confirmarNivel() {
    if (!nivelNoPopup) return;
    setNivel(nivelNoPopup);
    setSetores([]);
    setDescricao("");
    setErro(null);
    setNivelNoPopup(null);
  }

  function adicionar() {
    const validacao = validarRegistroEstresse({ nivel, setores, descricao });

    if (!validacao.valido) {
      setErro(validacao.erro);
      return;
    }

    aoAlterar([
      ...registros,
      {
        id: gerarId("estresse"),
        nivel: nivel as NomeNivelEstresse,
        setores: [...setores],
        descricao: descricao.trim(),
      },
    ]);

    limpar();
  }

  return (
    <div className="termometro">
      {/* Registros já feitos */}
      {registros.length > 0 && (
        <div className="termometro__registros">
          {registros.map((registro) => (
            <article key={registro.id} className="registro">
              <div className="registro__topo">
                <span className="etiqueta" data-nivel={registro.nivel}>
                  {registro.nivel}
                </span>
                <span className="registro__setores">
                  {registro.setores.join(" · ")}
                </span>
                <BotaoIcone
                  icone="fechar"
                  rotulo="Remover registro"
                  tamanho={16}
                  perigo
                  onClick={() =>
                    aoAlterar(registros.filter((r) => r.id !== registro.id))
                  }
                />
              </div>

              {registro.descricao && (
                <p className="registro__descricao">{registro.descricao}</p>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Escolha do nível */}
      {!nivel && (
        <div className="niveis">
          {niveisEstresse.map((definicao) => (
            <button
              key={definicao.nome}
              type="button"
              className={`nivel nivel--${CLASSE_NIVEL_ESTRESSE[definicao.nome]}`}
              onClick={() => setNivelNoPopup(definicao.nome)}
            >
              <span className="nivel__marca" aria-hidden="true" />
              <span className="nivel__nome">{definicao.nome}</span>
              <Icone nome="seta_direita" tamanho={16} className="nivel__seta" />
            </button>
          ))}
        </div>
      )}

      {/* Detalhamento do registro em andamento */}
      {nivel && (
        <div className="termometro__painel anim-surgir">
          <div className="termometro__painel-topo">
            <span className="etiqueta" data-nivel={nivel}>
              {nivel}
            </span>
            <span className="termometro__painel-titulo">
              Quais setores estão envolvidos?
            </span>
            <BotaoIcone
              icone="fechar"
              rotulo="Cancelar registro"
              tamanho={16}
              onClick={limpar}
            />
          </div>

          <div className="opcoes-pilha">
            {setoresEstresse.map((setor) => {
              const marcado = setores.includes(setor);

              return (
                <label
                  key={setor}
                  className={`opcao ${marcado ? "opcao--marcada" : ""}`.trim()}
                >
                  <input
                    type="checkbox"
                    className="opcao__entrada"
                    checked={marcado}
                    onChange={() => {
                      setSetores((atuais) =>
                        atuais.includes(setor)
                          ? atuais.filter((s) => s !== setor)
                          : [...atuais, setor],
                      );
                      setErro(null);
                    }}
                  />
                  <span>{setor}</span>
                </label>
              );
            })}
          </div>

          {precisaDescricao && (
            <div className="campo">
              <label className="campo__rotulo">
                Descreva o ocorrido
                <span className="campo__obrigatorio">*</span>
              </label>
              <AreaTexto
                rows={4}
                placeholder="O que aconteceu e como foi resolvido?"
                value={descricao}
                invalido={Boolean(erro) && !descricao.trim()}
                onChange={(evento) => {
                  setDescricao(evento.target.value);
                  setErro(null);
                }}
              />
            </div>
          )}

          {erro && (
            <span className="campo__erro" role="alert">
              <Icone nome="alerta" tamanho={14} />
              {erro}
            </span>
          )}

          <Botao variante="primario" icone="mais" largo onClick={adicionar}>
            Adicionar registro
          </Botao>
        </div>
      )}

      {/* Pop-up explicativo — só sai pelo "Entendi", igual ao desktop */}
      <Folha
        aberta={definicaoNoPopup !== undefined}
        etiqueta="Termômetro de satisfação"
        titulo={`Nível ${definicaoNoPopup?.nome ?? ""}`}
        aoFechar={confirmarNivel}
        permiteFecharPorFora={false}
        rodape={
          <Botao variante="primario" largo onClick={confirmarNivel}>
            Entendi
          </Botao>
        }
      >
        <p className="texto-suave">{definicaoNoPopup?.descricao}</p>
      </Folha>
    </div>
  );
}
