// ================================================================
// ABA — IDENTIFICAÇÃO
// Quem está preenchendo e qual relatório será feito.
//
// Regras preservadas:
//   • escolher o nome preenche o e-mail cadastrado;
//   • o e-mail continua editável (executivo novo, sem cadastro);
//   • escolher o relatório define o caminho das próximas abas.
// ================================================================

import { Campo, Entrada, Icone, Selecao } from "@/componentes/ui";
import { Painel } from "@/componentes/layout";
import { executivos, ROTULOS_FLUXO } from "@cativa/nucleo/config";
import { emailValido } from "@cativa/nucleo/regras";
import { useFormulario } from "@/contexto/useFormulario";
import type { NomeFluxo } from "@cativa/nucleo/tipos";
import { PainelDiasSalvos } from "./PainelDiasSalvos";
import "./Identificacao.css";

const CARTOES_FLUXO: {
  fluxo: NomeFluxo;
  icone: "carteira" | "predio";
  descricao: string;
  itens: string[];
}[] = [
  {
    fluxo: "despesas",
    icone: "carteira",
    descricao: "Trajetos rodados e gastos com comprovante.",
    itens: ["Cálculo automático de KM", "Anexo da nota fiscal"],
  },
  {
    fluxo: "visita",
    icone: "predio",
    descricao: "Agências visitadas e o termômetro de cada uma.",
    itens: ["Perfil comercial da agência", "Nível de estresse e ações"],
  },
];

export function Identificacao() {
  const { estado, despachar, selecionarExecutivo } = useFormulario();
  const { identificacao } = estado;

  const emailPreenchidoEInvalido =
    identificacao.email.length > 0 && !emailValido(identificacao.email);

  const podeEscolherFluxo =
    Boolean(identificacao.nome) && emailValido(identificacao.email);

  return (
    <div className="pilha pilha-6">
      <Painel
        etiqueta="Etapa 1"
        titulo="Identificação"
        descricao="Confirme quem está preenchendo e escolha o relatório do dia."
      >
        <div className="grade-campos grade-campos--2">
          <Campo rotulo="Seu nome" obrigatorio>
            {(id) => (
              <Selecao
                id={id}
                placeholder="-- Selecione --"
                value={identificacao.nome}
                opcoes={executivos.map((executivo) => ({
                  valor: executivo.valor,
                  rotulo: executivo.rotulo,
                }))}
                onChange={(evento) => selecionarExecutivo(evento.target.value)}
              />
            )}
          </Campo>

          <Campo
            rotulo="Seu e-mail"
            obrigatorio
            ajuda="Preenchido automaticamente — ajuste se necessário."
            erro={emailPreenchidoEInvalido ? "E-mail em formato inválido." : null}
          >
            {(id) => (
              <Entrada
                id={id}
                type="email"
                placeholder="exemplo@cativaoperadora.com.br"
                value={identificacao.email}
                invalido={emailPreenchidoEInvalido}
                onChange={(evento) =>
                  despachar({
                    tipo: "definir-identificacao",
                    dados: { email: evento.target.value },
                  })
                }
              />
            )}
          </Campo>
        </div>

        {/* ── Escolha do relatório ─────────────────────────────── */}
        <div className="escolha">
          <div className="escolha__cabecalho">
            <h3 className="escolha__titulo">Qual relatório você vai preencher?</h3>
            <p className="escolha__ajuda">
              Você pode preencher o outro depois, no mesmo dia.
            </p>
          </div>

          <div className="escolha__cartoes">
            {CARTOES_FLUXO.map((cartao) => (
              <button
                key={cartao.fluxo}
                type="button"
                className="escolha__cartao"
                disabled={!podeEscolherFluxo}
                onClick={() =>
                  despachar({ tipo: "escolher-fluxo", fluxo: cartao.fluxo })
                }
              >
                <span className="escolha__icone">
                  <Icone nome={cartao.icone} tamanho={20} />
                </span>

                <span className="escolha__conteudo">
                  <span className="escolha__nome">
                    {ROTULOS_FLUXO[cartao.fluxo]}
                  </span>
                  <span className="escolha__descricao">{cartao.descricao}</span>

                  <span className="escolha__itens">
                    {cartao.itens.map((item) => (
                      <span key={item} className="escolha__item">
                        <Icone nome="checar" tamanho={12} />
                        {item}
                      </span>
                    ))}
                  </span>
                </span>

                <span className="escolha__seta">
                  <Icone nome="seta_direita" tamanho={18} />
                </span>
              </button>
            ))}
          </div>

          {!podeEscolherFluxo && (
            <p className="escolha__bloqueio">
              <Icone nome="informacao" tamanho={14} />
              Selecione seu nome e confirme o e-mail para liberar os relatórios.
            </p>
          )}
        </div>
      </Painel>

      <PainelDiasSalvos />
    </div>
  );
}
