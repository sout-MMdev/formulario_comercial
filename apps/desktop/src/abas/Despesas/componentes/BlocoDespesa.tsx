// ================================================================
// BLOCO DE DESPESA
// Um gasto: data, cartão, categoria, valor e comprovante.
//
// Regras preservadas da v1:
//   • a categoria só aparece depois que o cartão é escolhido;
//   • Cartão Pessoal exige o anexo da nota fiscal;
//   • Cartão Clara não pede anexo (a empresa já pagou);
//   • trocar o cartão limpa categoria e anexo.
//
// Novidade: o bloco informa na hora como aquele gasto entra na
// conta — somado, descontado ou apenas informativo.
// ================================================================

import {
  BotaoIcone,
  Campo,
  EntradaMoeda,
  Icone,
  SeletorData,
  Selecao,
} from "@/componentes/ui";
import { CampoArquivo } from "@/componentes/campos";
import { cartoes, categoriasDespesa } from "@cativa/nucleo/config";
import { classificarDespesa, exigeComprovante } from "@cativa/nucleo/regras";
import type { Despesa, SituacaoDespesa, TipoCartao } from "@cativa/nucleo/tipos";

const EXPLICACAO: Record<SituacaoDespesa, { texto: string; classe: string }> = {
  reembolsado: {
    texto: "Este valor será somado ao seu reembolso.",
    classe: "situacao--soma",
  },
  descontado: {
    texto: "Abastecimento no Cartão Clara é descontado do reembolso de KM.",
    classe: "situacao--desconto",
  },
  informativo: {
    texto: "Já pago pela empresa — registrado apenas para controle.",
    classe: "situacao--neutro",
  },
};

interface PropsBlocoDespesa {
  despesa: Despesa;
  ordem: number;
  podeRemover: boolean;
  aoAlterar: (dados: Partial<Despesa>) => void;
  aoRemover: () => void;
}

export function BlocoDespesa({
  despesa,
  ordem,
  podeRemover,
  aoAlterar,
  aoRemover,
}: PropsBlocoDespesa) {
  const cartaoEscolhido = Boolean(despesa.cartao);
  const precisaComprovante = exigeComprovante(despesa.cartao);
  const situacao = classificarDespesa(despesa);
  const explicacao = EXPLICACAO[situacao];

  return (
    <article className="bloco">
      <header className="bloco__cabecalho">
        <div className="bloco__identificacao">
          <span className="bloco__ordem">{ordem}</span>
          <span className="bloco__titulo">
            Despesa {ordem}
            {despesa.categoria && (
              <span className="bloco__legenda"> · {despesa.categoria}</span>
            )}
          </span>
        </div>

        <BotaoIcone
          icone="lixeira"
          rotulo="Remover despesa"
          disabled={!podeRemover}
          onClick={aoRemover}
        />
      </header>

      <div className="bloco__corpo">
        <div className="grade-campos grade-campos--2">
          <Campo rotulo="Data" obrigatorio>
            {(id) => (
              <SeletorData
                id={id}
                valor={despesa.data}
                aoAlterar={(data) => aoAlterar({ data })}
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
                  aoAlterar({ cartao: evento.target.value as TipoCartao | "" })
                }
              />
            )}
          </Campo>
        </div>

        {/* Campos que só fazem sentido depois de escolher o cartão */}
        {cartaoEscolhido && (
          <>
            <div className="grade-campos grade-campos--2">
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
                      aoAlterar({ categoria: evento.target.value })
                    }
                  />
                )}
              </Campo>

              <Campo rotulo="Valor" obrigatorio>
                {(id) => (
                  <EntradaMoeda
                    id={id}
                    valor={despesa.valor}
                    aoAlterar={(valor) => aoAlterar({ valor })}
                  />
                )}
              </Campo>
            </div>

            {precisaComprovante && (
              <Campo
                rotulo="Nota fiscal"
                obrigatorio
                ajuda="Obrigatória no Cartão Pessoal — é o que garante o seu reembolso."
                erro={
                  !despesa.nomeArquivo ? "Anexe a nota fiscal desta despesa." : null
                }
              >
                {(id) => (
                  <CampoArquivo
                    id={id}
                    nomeArquivo={despesa.nomeArquivo}
                    aoAlterar={(nomeArquivo) => aoAlterar({ nomeArquivo })}
                    invalido={!despesa.nomeArquivo}
                  />
                )}
              </Campo>
            )}

            {despesa.categoria && (
              <p className={`situacao ${explicacao.classe}`}>
                <Icone
                  nome={
                    situacao === "reembolsado"
                      ? "sucesso"
                      : situacao === "descontado"
                        ? "alerta"
                        : "informacao"
                  }
                  tamanho={15}
                />
                {explicacao.texto}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
