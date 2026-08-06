// ================================================================
// ABA — VISITA
// Data do dia e a lista de agências visitadas.
//
// A lista alimenta a aba Agências: cada nome preenchido aqui vira
// um bloco de análise comercial lá.
// ================================================================

import { Botao, BotaoIcone, Campo, Icone, SeletorData } from "@/componentes/ui";
import { Painel } from "@/componentes/layout";
import { CampoAgencia } from "@/componentes/campos";
import { validarVisita } from "@cativa/nucleo/regras";
import { useFormulario } from "@/contexto/useFormulario";
import "./Visita.css";

export function Visita() {
  const { estado, despachar, irParaEtapa, agenciasVisitadas } = useFormulario();
  const { visita } = estado;

  const validacao = validarVisita(visita);
  const podeRemover = visita.agencias.length > 1;

  return (
    <Painel
      etiqueta="Relatório de Visita"
      titulo="Visita"
      descricao="Informe a data e as agências que você visitou neste dia."
      extra={
        agenciasVisitadas.length > 0 && (
          <span className="etiqueta etiqueta--marca">
            {agenciasVisitadas.length}{" "}
            {agenciasVisitadas.length === 1 ? "agência" : "agências"}
          </span>
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
            variante="primario"
            iconeFim="seta_direita"
            disabled={!validacao.valido}
            title={validacao.erro ?? undefined}
            onClick={() => irParaEtapa("agencias")}
          >
            Próximo
          </Botao>
        </div>
      }
    >
      <div className="grade-campos grade-campos--2">
        <Campo rotulo="Data da visita" obrigatorio>
          {(id) => (
            <SeletorData
              id={id}
              valor={visita.data}
              aoAlterar={(data) =>
                despachar({ tipo: "definir-data-visita", data })
              }
            />
          )}
        </Campo>
      </div>

      {/* ── Lista de agências ────────────────────────────────── */}
      <div className="agencias-visita">
        <div className="agencias-visita__cabecalho">
          <span className="campo__rotulo">
            Agências visitadas
            <span className="campo__obrigatorio">*</span>
          </span>
          <span className="campo__ajuda">
            Cada agência da lista vira um bloco de análise na próxima etapa.
          </span>
        </div>

        <ul className="agencias-visita__lista">
          {visita.agencias.map((agencia, indice) => (
            <li key={agencia.id} className="agencias-visita__linha">
              <span className="agencias-visita__ordem">{indice + 1}</span>

              <CampoAgencia
                valor={agencia.nome}
                aoAlterar={(nome) =>
                  despachar({
                    tipo: "alterar-agencia-visitada",
                    id: agencia.id,
                    nome,
                  })
                }
              />

              <BotaoIcone
                icone="lixeira"
                rotulo="Remover agência"
                disabled={!podeRemover}
                onClick={() =>
                  despachar({
                    tipo: "remover-agencia-visitada",
                    id: agencia.id,
                  })
                }
              />
            </li>
          ))}
        </ul>

        <Botao
          variante="adicionar"
          icone="mais"
          onClick={() => despachar({ tipo: "adicionar-agencia-visitada" })}
        >
          Adicionar agência
        </Botao>
      </div>

      {!validacao.valido && (
        <p className="aviso aviso--atencao">
          <Icone nome="informacao" tamanho={16} className="aviso__icone" />
          <span>{validacao.erro}</span>
        </p>
      )}
    </Painel>
  );
}
