// ================================================================
// PASSO — RESUMO
// Fechamento do dia. O total a reembolsar vem primeiro e grande:
// é o número que o executivo quer ver antes de qualquer detalhe.
//
// Regra preservada: só salva com pelo menos um trajeto ou uma
// agência visitada.
// ================================================================

import { useState } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { Icone } from "@/componentes/ui/Icone";
import { Folha } from "@/componentes/ui/Folha";
import { TelaPasso } from "@/componentes/layout/TelaPasso";
import { ROTULOS_FLUXO } from "@cativa/nucleo/config";
import {
  classificarDespesa,
  despesaPreenchida,
  ROTULOS_SITUACAO,
  trajetoPreenchido,
  validarSalvarDia,
  VARIANTE_ETIQUETA_SITUACAO,
} from "@cativa/nucleo/regras";
import {
  formatarData,
  formatarKm,
  formatarMoeda,
  juntarLista,
} from "@cativa/nucleo/utils";
import type { ResultadoEnvio } from "@cativa/nucleo/servicos/envio";
import { useFormulario } from "@/contexto/useFormulario";
import { PASSOS } from "@/navegacao/passos";
import "./Resumo.css";

export function Resumo() {
  const {
    estado,
    voltar,
    indicePasso,
    sequencia,
    sentido,
    temAnterior,
    totais,
    fluxosFaltando,
    agenciasVisitadas,
    adicionarRelatorio,
    salvarDia,
  } = useFormulario();

  const { trajetos, despesas, agenciasComercial, visita } = estado;
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);

  const trajetosValidos = trajetos.filter(trajetoPreenchido);
  const despesasValidas = despesas.filter(despesaPreenchida);
  const validacao = validarSalvarDia({ trajetos, agenciasVisitadas });

  async function aoSalvar() {
    setSalvando(true);
    const retorno = await salvarDia();
    setResultado(retorno);
    setSalvando(false);
    setSalvo(true);
  }

  return (
    <>
      <TelaPasso
        etiqueta="Conferência"
        titulo={PASSOS.resumo.titulo}
        apoio={PASSOS.resumo.apoio}
        indice={indicePasso}
        total={sequencia.length}
        sentido={sentido}
        temVoltar={temAnterior}
        aoVoltar={voltar}
        aoAvancar={aoSalvar}
        podeAvancar={validacao.valido && !salvando}
        motivoBloqueio={validacao.erro}
        rotuloAvancar={salvando ? "Finalizando..." : "Finalizar relatório"}
        iconeAvancar="salvar"
      >
        {/* ── Total em destaque ────────────────────────────── */}
        {(trajetosValidos.length > 0 || despesasValidas.length > 0) && (
          <section className="total-dia">
            <span className="total-dia__rotulo">Total a reembolsar</span>
            <strong className="total-dia__valor">
              {formatarMoeda(totais.totalFinal)}
            </strong>

            <div className="total-dia__partes">
              <span className="total-dia__parte">
                <Icone nome="carro" tamanho={14} />
                KM
                <strong>{formatarMoeda(totais.totalKm)}</strong>
              </span>

              <span className="total-dia__parte">
                <Icone nome="carteira" tamanho={14} />
                Pessoal
                <strong>+ {formatarMoeda(totais.totalPessoal)}</strong>
              </span>

              <span className="total-dia__parte">
                <Icone nome="alerta" tamanho={14} />
                Abast. Clara
                <strong>− {formatarMoeda(totais.totalAbastecimentoClara)}</strong>
              </span>
            </div>
          </section>
        )}

        {/* ── Visita ───────────────────────────────────────── */}
        {agenciasVisitadas.length > 0 && (
          <section className="bloco-resumo">
            <h2 className="bloco-resumo__titulo">
              <Icone nome="predio" tamanho={15} />
              Visita
              <span className="etiqueta etiqueta--neutra">
                {agenciasVisitadas.length}
              </span>
            </h2>

            <div className="cartao">
              <div className="cartao__corpo">
                <div className="linha-dado">
                  <span className="linha-dado__chave">Data</span>
                  <span className="linha-dado__valor">
                    {formatarData(visita.data)}
                  </span>
                </div>
                <div className="linha-dado">
                  <span className="linha-dado__chave">Agências</span>
                  <span className="linha-dado__valor">
                    {juntarLista(agenciasVisitadas)}
                  </span>
                </div>
              </div>
            </div>

            {agenciasComercial.map((agencia) => (
              <div key={agencia.id} className="cartao">
                <div className="cartao__cabecalho">{agencia.nome}</div>
                <div className="cartao__corpo">
                  {agencia.faturamentoAnualLabel && (
                    <div className="linha-dado">
                      <span className="linha-dado__chave">Faturamento</span>
                      <span className="linha-dado__valor">
                        {agencia.faturamentoAnualLabel}
                      </span>
                    </div>
                  )}

                  {agencia.produtos.length > 0 && (
                    <div className="linha-dado">
                      <span className="linha-dado__chave">Produtos</span>
                      <span className="linha-dado__valor">
                        {juntarLista(agencia.produtos)}
                      </span>
                    </div>
                  )}

                  {agencia.atendentes.length > 0 && (
                    <div className="linha-dado">
                      <span className="linha-dado__chave">Atendentes</span>
                      <span className="linha-dado__valor">
                        {juntarLista(agencia.atendentes)}
                      </span>
                    </div>
                  )}

                  {agencia.estresses.map((estresse) => (
                    <div key={estresse.id} className="resumo-estresse">
                      <span className="etiqueta" data-nivel={estresse.nivel}>
                        {estresse.nivel}
                      </span>
                      <span className="resumo-estresse__texto">
                        {juntarLista(estresse.setores)}
                        {estresse.descricao && <p>{estresse.descricao}</p>}
                      </span>
                    </div>
                  ))}

                  {agencia.acoes.map((acao) => (
                    <div key={acao.setor} className="linha-dado">
                      <span className="linha-dado__chave">{acao.setor}</span>
                      <span className="linha-dado__valor">
                        {acao.detalhe || "(sem detalhes)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Deslocamentos ────────────────────────────────── */}
        {trajetosValidos.length > 0 && (
          <section className="bloco-resumo">
            <h2 className="bloco-resumo__titulo">
              <Icone nome="carro" tamanho={15} />
              Deslocamentos
              <span className="etiqueta etiqueta--neutra">
                {trajetosValidos.length}
              </span>
            </h2>

            {trajetosValidos.map((trajeto, indice) => (
              <div key={trajeto.id} className="cartao">
                <div className="cartao__cabecalho">
                  <span>Trajeto {indice + 1}</span>
                  <span className="texto-fraco texto-pequeno">
                    {formatarData(trajeto.data)}
                  </span>
                </div>
                <div className="cartao__corpo">
                  <div className="linha-dado">
                    <span className="linha-dado__chave">Rota</span>
                    <span className="linha-dado__valor">
                      {trajeto.partida || "—"} → {trajeto.destino || "—"}
                    </span>
                  </div>
                  <div className="linha-dado">
                    <span className="linha-dado__chave">Distância</span>
                    <span className="linha-dado__valor">
                      {formatarKm(trajeto.km)}
                    </span>
                  </div>
                  <div className="linha-dado">
                    <span className="linha-dado__chave">Reembolso</span>
                    <span className="linha-dado__valor texto-marca">
                      {formatarMoeda(trajeto.reembolsoKm)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Gastos ───────────────────────────────────────── */}
        {despesasValidas.length > 0 && (
          <section className="bloco-resumo">
            <h2 className="bloco-resumo__titulo">
              <Icone nome="carteira" tamanho={15} />
              Gastos
              <span className="etiqueta etiqueta--neutra">
                {despesasValidas.length}
              </span>
            </h2>

            {despesasValidas.map((despesa, indice) => {
              const situacao = classificarDespesa(despesa);

              return (
                <div key={despesa.id} className="cartao">
                  <div className="cartao__cabecalho">
                    <span>Despesa {indice + 1}</span>
                    <span className="texto-fraco texto-pequeno">
                      {formatarData(despesa.data)}
                    </span>
                  </div>
                  <div className="cartao__corpo">
                    <div className="linha-dado">
                      <span className="linha-dado__chave">Cartão</span>
                      <span className="linha-dado__valor">
                        {despesa.cartao || "—"}
                      </span>
                    </div>
                    <div className="linha-dado">
                      <span className="linha-dado__chave">Categoria</span>
                      <span className="linha-dado__valor">
                        {despesa.categoria || "—"}
                      </span>
                    </div>
                    <div className="linha-dado">
                      <span className="linha-dado__chave">Valor</span>
                      <span className="linha-dado__valor">
                        {formatarMoeda(despesa.valor)}
                      </span>
                    </div>
                    <div className="linha-dado">
                      <span className="linha-dado__chave">Situação</span>
                      <span className="linha-dado__valor">
                        <span
                          className={`etiqueta etiqueta--${VARIANTE_ETIQUETA_SITUACAO[situacao]}`}
                        >
                          {ROTULOS_SITUACAO[situacao]}
                        </span>
                      </span>
                    </div>
                    {despesa.nomeArquivo && (
                      <div className="linha-dado">
                        <span className="linha-dado__chave">Comprovante</span>
                        <span className="linha-dado__valor">
                          {despesa.nomeArquivo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ── Outro relatório do mesmo dia ─────────────────── */}
        {fluxosFaltando.length > 0 ? (
          <section className="outro-relatorio">
            <p className="outro-relatorio__texto">
              Precisa preencher o outro relatório deste dia?
            </p>
            {fluxosFaltando.map((fluxo) => (
              <Botao
                key={fluxo}
                variante="contorno"
                icone="mais"
                largo
                onClick={() => adicionarRelatorio(fluxo)}
              >
                {ROTULOS_FLUXO[fluxo]}
              </Botao>
            ))}
          </section>
        ) : (
          <p className="aviso aviso--sucesso">
            <Icone nome="sucesso" tamanho={18} className="aviso__icone" />
            <span>Os dois relatórios já estão preenchidos neste dia.</span>
          </p>
        )}
      </TelaPasso>

      {/* ── Confirmação ──────────────────────────────────────── */}
      <Folha
        aberta={salvo}
        etiqueta="Relatório finalizado"
        titulo="Relatório enviado!"
        aoFechar={() => setSalvo(false)}
        rodape={
          <Botao variante="primario" largo onClick={() => setSalvo(false)}>
            Começar outro dia
          </Botao>
        }
      >
        <p className="texto-suave">
          O relatório foi <strong>enviado ao CRM</strong>.
          {resultado?.emailEnviado ? (
            <>
              {" "}
              Uma cópia foi para o seu e-mail (
              <strong>{resultado.emailDestino}</strong>).
            </>
          ) : (
            " Não foi possível identificar seu e-mail para enviar a cópia."
          )}
        </p>
      </Folha>
    </>
  );
}
