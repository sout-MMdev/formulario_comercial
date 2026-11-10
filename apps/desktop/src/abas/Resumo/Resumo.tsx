// ================================================================
// ABA — RESUMO
// Confere tudo antes de salvar, oferece preencher o outro
// relatório do dia e grava o registro.
//
// Regra preservada: só é possível salvar com pelo menos um
// trajeto ou uma agência visitada.
// ================================================================

import { useState } from "react";
import { Botao, Icone, Modal } from "@/componentes/ui";
import { Painel } from "@/componentes/layout";
import { ROTULOS_FLUXO } from "@cativa/nucleo/config";
import {
  classificarDespesa,
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
  limparLocal,
} from "@cativa/nucleo/utils";
import {
  classificarEnvio,
  type ResultadoEnvio,
} from "@cativa/nucleo/servicos/envio";
import { useFormulario } from "@/contexto/useFormulario";
import { CartoesTotais } from "./componentes/CartoesTotais";
import { LinhaDado, SecaoResumo } from "./componentes/SecaoResumo";
import "./Resumo.css";

export function Resumo() {
  const {
    estado,
    despachar,
    irParaEtapa,
    totais,
    fluxosFaltando,
    agenciasVisitadas,
    salvarDia,
  } = useFormulario();

  const { trajetos, despesas, agenciasComercial, visita } = estado;
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);

  const trajetosValidos = trajetos.filter(trajetoPreenchido);
  const despesasValidas = despesas.filter((d) => d.data || d.cartao);
  const validacao = validarSalvarDia({ trajetos, agenciasVisitadas });

  const vazio =
    trajetosValidos.length === 0 &&
    despesasValidas.length === 0 &&
    agenciasVisitadas.length === 0;

  async function aoSalvar() {
    setSalvando(true);
    const retorno = await salvarDia();
    setResultado(retorno);
    setSalvando(false);
    setSalvo(true);
  }

  // Só há "enviado com sucesso" quando o CRM aceitou o relatório.
  const situacao = resultado ? classificarEnvio(resultado) : null;
  const envioFalhou = situacao?.tipo === "falhou";

  function fecharConfirmacao() {
    setSalvo(false);
    // Na falha, o executivo fica no resumo com os dados para tentar de novo.
    if (!envioFalhou) irParaEtapa("identificacao");
  }

  return (
    <>
      <Painel
        etiqueta="Conferência"
        titulo="Resumo do dia"
        descricao="Revise os dados antes de salvar. Nada é enviado até você confirmar."
        acoes={
          <div className="barra-acoes">
            <Botao
              variante="contorno"
              icone="seta_esquerda"
              onClick={() => irParaEtapa("identificacao")}
            >
              Voltar ao início
            </Botao>

            <Botao
              variante="destaque"
              icone="salvar"
              disabled={!validacao.valido || salvando}
              title={validacao.erro ?? undefined}
              onClick={aoSalvar}
            >
              {salvando ? "Salvando..." : "Salvar o dia"}
            </Botao>
          </div>
        }
      >
        {vazio ? (
          <div className="estado-vazio">
            <Icone nome="documento" tamanho={22} />
            <span className="estado-vazio__titulo">Nada preenchido ainda</span>
            <span className="estado-vazio__texto">
              Volte a uma das etapas e registre pelo menos um trajeto, uma
              despesa ou uma agência visitada.
            </span>
          </div>
        ) : (
          <>
            {(trajetosValidos.length > 0 || despesasValidas.length > 0) && (
              <CartoesTotais totais={totais} />
            )}

            {/* ── Visita ───────────────────────────────────── */}
            {agenciasVisitadas.length > 0 && (
              <SecaoResumo
                icone="predio"
                titulo="Visita"
                contador={agenciasVisitadas.length}
              >
                <div className="cartao">
                  <div className="cartao__corpo">
                    <LinhaDado
                      chave="Data da visita"
                      valor={formatarData(visita.data)}
                    />
                    <LinhaDado
                      chave="Agências visitadas"
                      valor={juntarLista(agenciasVisitadas)}
                    />
                  </div>
                </div>

                {agenciasComercial.map((agencia) => (
                  <div key={agencia.id} className="cartao">
                    <div className="cartao__cabecalho">{agencia.nome}</div>

                    <div className="cartao__corpo">
                      {agencia.dataFundacao && (
                        <LinhaDado
                          chave="Fundação"
                          valor={formatarData(agencia.dataFundacao)}
                        />
                      )}

                      {agencia.faturamentoAnualLabel && (
                        <LinhaDado
                          chave="Faturamento anual"
                          valor={agencia.faturamentoAnualLabel}
                        />
                      )}

                      {agencia.produtos.length > 0 && (
                        <LinhaDado
                          chave="Produtos"
                          valor={juntarLista(agencia.produtos)}
                        />
                      )}

                      {agencia.atendentes.length > 0 && (
                        <LinhaDado
                          chave="Atendente(s)"
                          valor={juntarLista(agencia.atendentes)}
                        />
                      )}

                      {agencia.estresses.length > 0 && (
                        <div className="resumo-bloco">
                          <span className="resumo-bloco__titulo">
                            Termômetro de satisfação
                          </span>

                          {agencia.estresses.map((estresse) => (
                            <div key={estresse.id} className="resumo-estresse">
                              <span
                                className="etiqueta"
                                data-nivel={estresse.nivel}
                              >
                                {estresse.nivel}
                              </span>

                              <div className="resumo-estresse__texto">
                                <span>{juntarLista(estresse.setores)}</span>
                                {estresse.descricao && (
                                  <p>{estresse.descricao}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {agencia.acoes.length > 0 && (
                        <div className="resumo-bloco">
                          <span className="resumo-bloco__titulo">
                            Ações acordadas
                          </span>

                          {agencia.acoes.map((acao) => (
                            <LinhaDado
                              key={acao.setor}
                              chave={acao.setor}
                              valor={acao.detalhe || "(sem detalhes)"}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </SecaoResumo>
            )}

            {/* ── Deslocamentos ────────────────────────────── */}
            {trajetosValidos.length > 0 && (
              <SecaoResumo
                icone="carro"
                titulo="Deslocamentos"
                contador={trajetosValidos.length}
              >
                {trajetosValidos.map((trajeto, indice) => (
                  <div key={trajeto.id} className="cartao">
                    <div className="cartao__cabecalho">
                      <span>Trajeto {indice + 1}</span>
                      <span className="texto-fraco texto-pequeno">
                        {formatarData(trajeto.data)}
                      </span>
                    </div>

                    <div className="cartao__corpo">
                      <LinhaDado
                        chave="Partida"
                        valor={limparLocal(trajeto.partida) || "—"}
                      />
                      <LinhaDado
                        chave="Destino"
                        valor={limparLocal(trajeto.destino) || "—"}
                      />
                      <LinhaDado
                        chave="Distância"
                        valor={formatarKm(trajeto.km)}
                      />
                      <LinhaDado
                        chave="Reembolso"
                        valor={
                          <strong className="texto-marca">
                            {formatarMoeda(trajeto.reembolsoKm)}
                          </strong>
                        }
                      />
                    </div>
                  </div>
                ))}
              </SecaoResumo>
            )}

            {/* ── Despesas ─────────────────────────────────── */}
            {despesasValidas.length > 0 && (
              <SecaoResumo
                icone="carteira"
                titulo="Despesas"
                contador={despesasValidas.length}
              >
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
                        <LinhaDado chave="Cartão" valor={despesa.cartao || "—"} />
                        <LinhaDado
                          chave="Categoria"
                          valor={despesa.categoria || "—"}
                        />
                        <LinhaDado
                          chave="Valor"
                          valor={formatarMoeda(despesa.valor)}
                        />
                        <LinhaDado
                          chave="Situação"
                          valor={
                            <span
                              className={`etiqueta etiqueta--${VARIANTE_ETIQUETA_SITUACAO[situacao]}`}
                            >
                              {ROTULOS_SITUACAO[situacao]}
                            </span>
                          }
                        />
                        {despesa.nomeArquivo && (
                          <LinhaDado
                            chave="Comprovante"
                            valor={despesa.nomeArquivo}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </SecaoResumo>
            )}

            {/* ── Adicionar o outro relatório ──────────────── */}
            <div className="trocar-fluxo">
              {fluxosFaltando.length === 0 ? (
                <p className="aviso aviso--sucesso">
                  <Icone nome="sucesso" tamanho={16} className="aviso__icone" />
                  <span>Os dois relatórios já estão preenchidos neste dia.</span>
                </p>
              ) : (
                <>
                  <p className="trocar-fluxo__texto">
                    Precisa preencher o outro relatório deste mesmo dia?
                  </p>

                  {fluxosFaltando.map((fluxo) => (
                    <Botao
                      key={fluxo}
                      variante="contorno"
                      icone="mais"
                      onClick={() =>
                        despachar({ tipo: "adicionar-fluxo", fluxo })
                      }
                    >
                      Preencher também o {ROTULOS_FLUXO[fluxo]}
                    </Botao>
                  ))}
                </>
              )}
            </div>

            {!validacao.valido && (
              <p className="aviso aviso--atencao">
                <Icone nome="informacao" tamanho={16} className="aviso__icone" />
                <span>{validacao.erro}</span>
              </p>
            )}
          </>
        )}
      </Painel>

      {/* ── Confirmação de salvamento ──────────────────────────── */}
      <Modal
        aberto={salvo}
        etiqueta={envioFalhou ? "Envio não concluído" : "Relatório finalizado"}
        titulo={
          envioFalhou
            ? "Não foi possível enviar o relatório"
            : "Relatório enviado com sucesso"
        }
        aoFechar={fecharConfirmacao}
        rodape={
          <Botao variante="primario" onClick={fecharConfirmacao}>
            {envioFalhou ? "Voltar ao formulário" : "Voltar ao início"}
          </Botao>
        }
      >
        {situacao?.tipo === "falhou" ? (
          <p className="texto-suave">
            {situacao.motivo} Seus dados continuam no formulário para você
            enviar de novo.
          </p>
        ) : (
          <p className="texto-suave">
            O relatório foi <strong>enviado ao CRM</strong>.
            {situacao?.copia === "enviada" ? (
              <>
                {" "}
                Uma cópia foi enviada para o seu e-mail (
                <strong>{situacao.emailDestino}</strong>).
              </>
            ) : situacao?.copia === "falhou" ? (
              <>
                {" "}
                Não foi possível enviar a cópia para{" "}
                <strong>{situacao.emailDestino}</strong> agora.
              </>
            ) : (
              " Não foi possível identificar seu e-mail para enviar a cópia."
            )}
          </p>
        )}
      </Modal>
    </>
  );
}
