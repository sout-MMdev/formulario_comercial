// ================================================================
// TERMÔMETRO DE SATISFAÇÃO
// Fluxo preservado da v1, passo a passo:
//   1. o executivo escolhe o nível;
//   2. um pop-up explica o que aquele nível significa e só sai
//      pelo botão "Entendi" — a definição precisa ser lida;
//   3. o painel abre para marcar os setores envolvidos;
//   4. níveis Médio, Alto e Crítico exigem a descrição do ocorrido;
//   5. "Adicionar registro" valida e empilha o registro.
//
// Uma agência acumula quantos registros forem necessários.
// ================================================================

import { useState } from "react";
import {
  AreaTexto,
  Botao,
  BotaoIcone,
  Icone,
  Modal,
} from "@/componentes/ui";
import {
  CLASSE_NIVEL_ESTRESSE,
  niveisEstresse,
  setoresEstresse,
} from "@cativa/nucleo/config";
import { exigeDescricao, validarRegistroEstresse } from "@cativa/nucleo/regras";
import { gerarId } from "@cativa/nucleo/utils";
import type { NomeNivelEstresse, RegistroEstresse } from "@cativa/nucleo/tipos";

interface PropsTermometro {
  registros: RegistroEstresse[];
  aoAlterar: (registros: RegistroEstresse[]) => void;
}

export function Termometro({ registros, aoAlterar }: PropsTermometro) {
  // Nível aguardando confirmação no pop-up
  const [nivelNoPopup, setNivelNoPopup] = useState<NomeNivelEstresse | null>(
    null,
  );

  // Registro sendo montado no painel
  const [nivel, setNivel] = useState<NomeNivelEstresse | "">("");
  const [setores, setSetores] = useState<string[]>([]);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const painelAberto = nivel !== "";
  const precisaDescricao = exigeDescricao(nivel);
  const definicaoNoPopup = niveisEstresse.find((n) => n.nome === nivelNoPopup);

  function limparPainel() {
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

  function alternarSetor(setor: string) {
    setSetores((atuais) =>
      atuais.includes(setor)
        ? atuais.filter((item) => item !== setor)
        : [...atuais, setor],
    );
    setErro(null);
  }

  function adicionarRegistro() {
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

    limparPainel();
  }

  return (
    <div className="termometro">
      {/* ── Registros já adicionados ─────────────────────────── */}
      {registros.length > 0 && (
        <ul className="termometro__registros">
          {registros.map((registro) => (
            <li key={registro.id} className="registro">
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
                  tamanho={14}
                  onClick={() =>
                    aoAlterar(registros.filter((r) => r.id !== registro.id))
                  }
                />
              </div>

              {registro.descricao && (
                <p className="registro__descricao">{registro.descricao}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── Escolha do nível ─────────────────────────────────── */}
      <div className="termometro__niveis">
        {niveisEstresse.map((definicao) => (
          <button
            key={definicao.nome}
            type="button"
            className={[
              "nivel",
              `nivel--${CLASSE_NIVEL_ESTRESSE[definicao.nome]}`,
              nivel === definicao.nome ? "nivel--ativo" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setNivelNoPopup(definicao.nome)}
          >
            <span className="nivel__marca" aria-hidden="true" />
            {definicao.nome}
          </button>
        ))}
      </div>

      {/* ── Painel de detalhamento ───────────────────────────── */}
      {painelAberto && (
        <div className="termometro__painel anim-subir">
          <div className="termometro__painel-topo">
            <span className="termometro__painel-titulo">
              Nível <strong>{nivel}</strong> — o que está envolvido?
            </span>

            <BotaoIcone
              icone="fechar"
              rotulo="Cancelar registro"
              tamanho={14}
              onClick={limparPainel}
            />
          </div>

          <div className="opcoes-grade">
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
                    onChange={() => alternarSetor(setor)}
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
                rows={3}
                placeholder="Conte o que aconteceu e como foi resolvido."
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
              <Icone nome="alerta" tamanho={13} />
              {erro}
            </span>
          )}

          <Botao variante="primario" icone="mais" onClick={adicionarRegistro}>
            Adicionar registro
          </Botao>
        </div>
      )}

      {/* ── Pop-up explicativo do nível ──────────────────────── */}
      <Modal
        aberto={definicaoNoPopup !== undefined}
        etiqueta="Termômetro de satisfação"
        titulo={`Nível ${definicaoNoPopup?.nome ?? ""}`}
        aoFechar={confirmarNivel}
        permiteFecharPorFora={false}
        rodape={
          <Botao variante="primario" onClick={confirmarNivel}>
            Entendi
          </Botao>
        }
      >
        <p className="texto-suave">{definicaoNoPopup?.descricao}</p>
      </Modal>
    </div>
  );
}
