// ================================================================
// ABA — DESPESAS
// Trajetos (reembolso por KM) e despesas (com comprovante).
// Um resumo de totais acompanha o preenchimento em tempo real.
// ================================================================

import { Botao, Icone } from "@/componentes/ui";
import { Painel } from "@/componentes/layout";
import { validarDespesas } from "@cativa/nucleo/regras";
import { formatarMoeda } from "@cativa/nucleo/utils";
import { useFormulario } from "@/contexto/useFormulario";
import { BlocoDespesa } from "./componentes/BlocoDespesa";
import { BlocoTrajeto } from "./componentes/BlocoTrajeto";
import "./Despesas.css";

export function Despesas() {
  const { estado, despachar, irParaEtapa, totais } = useFormulario();
  const { trajetos, despesas, identificacao } = estado;

  const validacao = validarDespesas(trajetos, despesas);

  return (
    <Painel
      etiqueta="Relatório de Despesas"
      titulo="Despesas"
      descricao="Lance os trajetos rodados e os gastos do dia."
      extra={
        totais.totalFinal !== 0 && (
          <div className="previa-total">
            <span className="previa-total__rotulo">Total a reembolsar</span>
            <strong className="previa-total__valor">
              {formatarMoeda(totais.totalFinal)}
            </strong>
          </div>
        )
      }
      acoes={
        <div className="barra-acoes">
          <Botao
            variante="contorno"
            icone="seta_esquerda"
            onClick={() => irParaEtapa("identificacao")}
          >
            Voltar
          </Botao>

          <Botao
            variante="destaque"
            iconeFim="seta_direita"
            disabled={!validacao.valido}
            title={validacao.erro ?? undefined}
            onClick={() => irParaEtapa("resumo")}
          >
            Finalizar relatório
          </Botao>
        </div>
      }
    >
      {/* ── Trajetos ─────────────────────────────────────────── */}
      <section className="secao">
        <header className="secao__cabecalho">
          <span className="secao__icone">
            <Icone nome="carro" tamanho={17} />
          </span>

          <div className="secao__textos">
            <h3 className="secao__titulo">Trajetos</h3>
            <p className="secao__descricao">
              O reembolso é calculado pela sua tarifa por quilômetro.
            </p>
          </div>

          {totais.totalKm > 0 && (
            <span className="etiqueta etiqueta--marca">
              {formatarMoeda(totais.totalKm)}
            </span>
          )}
        </header>

        <div className="lista-blocos">
          {trajetos.map((trajeto, indice) => (
            <BlocoTrajeto
              key={trajeto.id}
              trajeto={trajeto}
              ordem={indice + 1}
              nomeExecutivo={identificacao.nome}
              podeRemover={trajetos.length > 1}
              aoAlterar={(dados) =>
                despachar({ tipo: "alterar-trajeto", id: trajeto.id, dados })
              }
              aoRemover={() =>
                despachar({ tipo: "remover-trajeto", id: trajeto.id })
              }
            />
          ))}
        </div>

        <Botao
          variante="adicionar"
          icone="mais"
          onClick={() => despachar({ tipo: "adicionar-trajeto" })}
        >
          Adicionar outro trajeto
        </Botao>
      </section>

      {/* ── Despesas ─────────────────────────────────────────── */}
      <section className="secao">
        <header className="secao__cabecalho">
          <span className="secao__icone">
            <Icone nome="carteira" tamanho={17} />
          </span>

          <div className="secao__textos">
            <h3 className="secao__titulo">Despesas</h3>
            <p className="secao__descricao">
              Cartão Pessoal soma ao reembolso; abastecimento no Clara desconta.
            </p>
          </div>

          {totais.totalPessoal > 0 && (
            <span className="etiqueta etiqueta--marca">
              {formatarMoeda(totais.totalPessoal)}
            </span>
          )}
        </header>

        <div className="lista-blocos">
          {despesas.map((despesa, indice) => (
            <BlocoDespesa
              key={despesa.id}
              despesa={despesa}
              ordem={indice + 1}
              podeRemover={despesas.length > 1}
              aoAlterar={(dados) =>
                despachar({ tipo: "alterar-despesa", id: despesa.id, dados })
              }
              aoRemover={() =>
                despachar({ tipo: "remover-despesa", id: despesa.id })
              }
            />
          ))}
        </div>

        <Botao
          variante="adicionar"
          icone="mais"
          onClick={() => despachar({ tipo: "adicionar-despesa" })}
        >
          Adicionar outra despesa
        </Botao>
      </section>

      {!validacao.valido && (
        <p className="aviso aviso--atencao">
          <Icone nome="informacao" tamanho={16} className="aviso__icone" />
          <span>{validacao.erro}</span>
        </p>
      )}
    </Painel>
  );
}
