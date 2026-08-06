// ================================================================
// PASSO — GASTOS
// Lista de despesas, cada uma editada em folha.
//
// Regras preservadas do desktop:
//   • categoria e valor só aparecem depois de escolher o cartão;
//   • Cartão Pessoal exige a nota fiscal;
//   • trocar o cartão limpa categoria e anexo;
//   • a tela informa como aquele gasto entra na conta.
// ================================================================

import { useState } from "react";
import { Botao, BotaoIcone } from "@/componentes/ui/Botao";
import { Campo, EntradaMoeda, Selecao } from "@/componentes/ui/Campo";
import { Icone } from "@/componentes/ui/Icone";
import { Folha } from "@/componentes/ui/Folha";
import { SeletorData } from "@/componentes/ui/SeletorData";
import { TelaPasso } from "@/componentes/layout/TelaPasso";
import { CampoArquivo } from "@/componentes/campos/CampoArquivo";
import {
  cartoes,
  categoriasDespesa,
  ROTULOS_FLUXO,
} from "@cativa/nucleo/config";
import {
  classificarDespesa,
  despesaPreenchida,
  exigeComprovante,
  validarDespesas,
} from "@cativa/nucleo/regras";
import { formatarData, formatarMoeda } from "@cativa/nucleo/utils";
import { useFormulario } from "@/contexto/useFormulario";
import { PASSOS } from "@/navegacao/passos";
import type { Despesa, SituacaoDespesa, TipoCartao } from "@cativa/nucleo/tipos";
import "./Gastos.css";

const EXPLICACAO: Record<SituacaoDespesa, { texto: string; classe: string }> = {
  reembolsado: {
    texto: "Este valor será somado ao seu reembolso.",
    classe: "aviso--sucesso",
  },
  descontado: {
    texto: "Abastecimento no Cartão Clara é descontado do reembolso de KM.",
    classe: "aviso--atencao",
  },
  informativo: {
    texto: "Já pago pela empresa — registrado apenas para controle.",
    classe: "",
  },
};

export function Gastos() {
  const {
    estado,
    despachar,
    avancar,
    voltar,
    indicePasso,
    sequencia,
    sentido,
    temAnterior,
    totais,
  } = useFormulario();

  const { despesas, trajetos } = estado;
  const [emEdicao, setEmEdicao] = useState<string | null>(null);

  const despesa = despesas.find((item) => item.id === emEdicao) ?? null;
  const preenchidas = despesas.filter(despesaPreenchida);
  const validacao = validarDespesas(trajetos, despesas);

  function alterar(dados: Partial<Despesa>) {
    if (!despesa) return;
    despachar({ tipo: "alterar-despesa", id: despesa.id, dados });
  }

  const precisaComprovante = despesa ? exigeComprovante(despesa.cartao) : false;
  const situacao = despesa ? classificarDespesa(despesa) : "informativo";

  return (
    <TelaPasso
      etiqueta={ROTULOS_FLUXO.despesas}
      titulo={PASSOS.gastos.titulo}
      apoio={PASSOS.gastos.apoio}
      indice={indicePasso}
      total={sequencia.length}
      sentido={sentido}
      temVoltar={temAnterior}
      aoVoltar={voltar}
      aoAvancar={avancar}
      podeAvancar={validacao.valido}
      motivoBloqueio={validacao.erro}
      rotuloAvancar={
        preenchidas.length === 0 ? "Não tive gastos" : "Ir para o resumo"
      }
    >
      {totais.totalPessoal > 0 && (
        <div className="resumo-faixa">
          <span className="resumo-faixa__rotulo">
            <Icone nome="carteira" tamanho={15} />
            Cartão Pessoal
          </span>
          <strong className="resumo-faixa__valor">
            {formatarMoeda(totais.totalPessoal)}
          </strong>
        </div>
      )}

      <div className="lista">
        {despesas.map((item, indice) => {
          const vazia = !despesaPreenchida(item);
          const faltaNota = exigeComprovante(item.cartao) && !item.nomeArquivo;

          return (
            <div key={item.id} className="linha-item">
              <button
                type="button"
                className="item-lista"
                onClick={() => setEmEdicao(item.id)}
              >
                <span className="item-lista__marca">
                  <Icone nome="carteira" tamanho={20} />
                </span>

                <span className="item-lista__texto">
                  <span className="item-lista__titulo">
                    {vazia
                      ? `Despesa ${indice + 1}`
                      : item.categoria || item.cartao}
                  </span>
                  <span className="item-lista__detalhe">
                    {vazia
                      ? "Toque para preencher"
                      : `${formatarData(item.data)} · ${item.cartao}`}
                  </span>
                </span>

                {faltaNota && (
                  <span className="etiqueta etiqueta--erro">Sem nota</span>
                )}

                {item.valor > 0 && !faltaNota && (
                  <span className="item-lista__valor">
                    {formatarMoeda(item.valor)}
                  </span>
                )}
              </button>

              <BotaoIcone
                icone="lixeira"
                rotulo={`Remover despesa ${indice + 1}`}
                perigo
                disabled={despesas.length <= 1}
                onClick={() =>
                  despachar({ tipo: "remover-despesa", id: item.id })
                }
              />
            </div>
          );
        })}
      </div>

      <Botao
        variante="adicionar"
        icone="mais"
        onClick={() => despachar({ tipo: "adicionar-despesa" })}
      >
        Adicionar outro gasto
      </Botao>

      {/* ── Editor ───────────────────────────────────────────── */}
      <Folha
        aberta={despesa !== null}
        etiqueta="Gasto"
        titulo={`Despesa ${despesas.findIndex((d) => d.id === emEdicao) + 1}`}
        aoFechar={() => setEmEdicao(null)}
        alta
        rodape={
          <Botao variante="primario" largo onClick={() => setEmEdicao(null)}>
            Pronto
          </Botao>
        }
      >
        {despesa && (
          <>
            <Campo rotulo="Data" obrigatorio>
              {(id) => (
                <SeletorData
                  id={id}
                  valor={despesa.data}
                  aoAlterar={(data) => alterar({ data })}
                />
              )}
            </Campo>

            <Campo rotulo="Cartão utilizado" obrigatorio>
              {(id) => (
                <Selecao
                  id={id}
                  value={despesa.cartao}
                  opcoes={cartoes.map((cartao) => ({
                    valor: cartao.valor,
                    rotulo: cartao.valor,
                  }))}
                  onChange={(evento) =>
                    alterar({ cartao: evento.target.value as TipoCartao | "" })
                  }
                />
              )}
            </Campo>

            {despesa.cartao && (
              <>
                <Campo rotulo="Onde ocorreu o gasto?" obrigatorio>
                  {(id) => (
                    <Selecao
                      id={id}
                      value={despesa.categoria}
                      opcoes={categoriasDespesa.map((categoria) => ({
                        valor: categoria,
                        rotulo: categoria,
                      }))}
                      onChange={(evento) =>
                        alterar({ categoria: evento.target.value })
                      }
                    />
                  )}
                </Campo>

                <Campo rotulo="Valor" obrigatorio>
                  {(id) => (
                    <EntradaMoeda
                      id={id}
                      valor={despesa.valor}
                      aoAlterar={(valor) => alterar({ valor })}
                    />
                  )}
                </Campo>

                {precisaComprovante && (
                  <Campo
                    rotulo="Nota fiscal"
                    obrigatorio
                    ajuda="Obrigatória no Cartão Pessoal — é o que garante o seu reembolso."
                    erro={
                      !despesa.nomeArquivo
                        ? "Anexe a nota fiscal desta despesa."
                        : null
                    }
                  >
                    {(id) => (
                      <CampoArquivo
                        id={id}
                        nomeArquivo={despesa.nomeArquivo}
                        aoAlterar={(nomeArquivo) => alterar({ nomeArquivo })}
                        invalido={!despesa.nomeArquivo}
                      />
                    )}
                  </Campo>
                )}

                {despesa.categoria && (
                  <p className={`aviso ${EXPLICACAO[situacao].classe}`.trim()}>
                    <Icone
                      nome={
                        situacao === "reembolsado"
                          ? "sucesso"
                          : situacao === "descontado"
                            ? "alerta"
                            : "informacao"
                      }
                      tamanho={18}
                      className="aviso__icone"
                    />
                    <span>{EXPLICACAO[situacao].texto}</span>
                  </p>
                )}
              </>
            )}
          </>
        )}
      </Folha>
    </TelaPasso>
  );
}
