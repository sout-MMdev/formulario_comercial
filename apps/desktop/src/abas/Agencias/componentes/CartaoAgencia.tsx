// ================================================================
// CARTÃO DE AGÊNCIA
// Reúne, para UMA agência: perfil comercial, termômetro de
// satisfação e ações acordadas.
//
// O bloco é recolhível — com 5 agências visitadas no dia, a tela
// continua navegável.
// ================================================================

import { useState } from "react";
import {
  Campo,
  Icone,
  MultiSelecao,
  SeletorData,
  Selecao,
} from "@/componentes/ui";
import {
  faturamentoAnualOpcoes,
  listaAtendentes,
  produtosAgencia,
} from "@cativa/nucleo/config";
import type { AgenciaComercial } from "@cativa/nucleo/tipos";
import { CampoEndereco } from "@/componentes/campos/CampoEndereco";
import { AcoesAcordadas } from "./AcoesAcordadas";
import { Termometro } from "./Termometro";

interface PropsCartaoAgencia {
  agencia: AgenciaComercial;
  ordem: number;
  aoAlterar: (dados: Partial<AgenciaComercial>) => void;
}

export function CartaoAgencia({
  agencia,
  ordem,
  aoAlterar,
}: PropsCartaoAgencia) {
  const [aberto, setAberto] = useState(ordem === 1);

  // Quanto do bloco já foi preenchido — mostrado no cabeçalho
  const preenchidos = [
    Boolean(agencia.dataFundacao),
    Boolean(agencia.faturamentoAnual),
    agencia.produtos.length > 0,
    agencia.atendentes.length > 0,
    agencia.estresses.length > 0,
  ].filter(Boolean).length;

  return (
    <article className="bloco">
      <header className="bloco__cabecalho">
        <button
          type="button"
          className="agencia__toggle"
          aria-expanded={aberto}
          onClick={() => setAberto((estava) => !estava)}
        >
          <span className="bloco__ordem">{ordem}</span>

          <span className="agencia__nome">{agencia.nome}</span>

          <span className="agencia__progresso">{preenchidos}/5</span>

          <Icone
            nome={aberto ? "seta_cima" : "seta_baixo"}
            tamanho={16}
            className="agencia__seta"
          />
        </button>
      </header>

      {aberto && (
        <div className="bloco__corpo anim-surgir">
          {/* ── Perfil comercial ─────────────────────────────── */}
          <div className="grade-campos grade-campos--2">
            <Campo rotulo="Data de fundação">
              {(id) => (
                <SeletorData
                  id={id}
                  valor={agencia.dataFundacao}
                  aoAlterar={(dataFundacao) => aoAlterar({ dataFundacao })}
                />
              )}
            </Campo>

            <Campo rotulo="Faturamento anual">
              {(id) => (
                <Selecao
                  id={id}
                  value={agencia.faturamentoAnual}
                  opcoes={faturamentoAnualOpcoes.map((opcao) => ({
                    valor: opcao.value,
                    rotulo: opcao.label,
                  }))}
                  onChange={(evento) => {
                    const valor = evento.target.value;
                    const opcao = faturamentoAnualOpcoes.find(
                      (item) => item.value === valor,
                    );
                    aoAlterar({
                      faturamentoAnual: valor,
                      faturamentoAnualLabel: opcao?.label ?? "",
                    });
                  }}
                />
              )}
            </Campo>
          </div>

          <CampoEndereco
            valor={agencia.endereco}
            aoAlterar={(endereco) => aoAlterar({ endereco })}
          />

          <div className="grade-campos grade-campos--2">
            <Campo rotulo="Produtos que mais vende">
              {(id) => (
                <MultiSelecao
                  id={id}
                  opcoes={produtosAgencia}
                  selecionados={agencia.produtos}
                  aoAlterar={(produtos) => aoAlterar({ produtos })}
                  placeholder="Selecione os produtos..."
                />
              )}
            </Campo>

            <Campo rotulo="Atendente de preferência">
              {(id) => (
                <MultiSelecao
                  id={id}
                  opcoes={listaAtendentes}
                  selecionados={agencia.atendentes}
                  aoAlterar={(atendentes) => aoAlterar({ atendentes })}
                  placeholder="Selecione os atendentes..."
                />
              )}
            </Campo>
          </div>

          {/* ── Termômetro ───────────────────────────────────── */}
          <section className="bloco__secao">
            <div className="agencia__secao-topo">
              <span className="bloco__secao-titulo">
                <Icone nome="termometro" tamanho={13} /> Termômetro de satisfação
              </span>
              <span className="campo__ajuda">
                Nível de estresse com o cliente e risco de perda da conta.
              </span>
            </div>

            <Termometro
              registros={agencia.estresses}
              aoAlterar={(estresses) => aoAlterar({ estresses })}
            />
          </section>

          {/* ── Ações acordadas ──────────────────────────────── */}
          <section className="bloco__secao">
            <div className="agencia__secao-topo">
              <span className="bloco__secao-titulo">
                <Icone nome="alvo" tamanho={13} /> Ações acordadas
              </span>
              <span className="campo__ajuda">
                Marque o setor e descreva o que foi combinado.
              </span>
            </div>

            <AcoesAcordadas
              acoes={agencia.acoes}
              aoAlterar={(acoes) => aoAlterar({ acoes })}
            />
          </section>
        </div>
      )}
    </article>
  );
}
