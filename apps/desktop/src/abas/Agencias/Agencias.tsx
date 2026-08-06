// ================================================================
// ABA — AGÊNCIAS
// Um cartão por agência listada na aba Visita, com perfil
// comercial, termômetro de satisfação e ações acordadas.
//
// A data da visita é herdada da aba anterior — o executivo não
// digita a mesma data duas vezes.
// ================================================================

import { Botao, Icone } from "@/componentes/ui";
import { Painel } from "@/componentes/layout";
import { formatarDataExtenso } from "@cativa/nucleo/utils";
import { useFormulario } from "@/contexto/useFormulario";
import { CartaoAgencia } from "./componentes/CartaoAgencia";
import "./Agencias.css";

export function Agencias() {
  const { estado, despachar, irParaEtapa } = useFormulario();
  const { agenciasComercial, visita } = estado;

  return (
    <Painel
      etiqueta="Relatório de Visita"
      titulo="Agências"
      descricao="Detalhe o perfil comercial e o termômetro de cada agência visitada."
      extra={
        visita.data && (
          <span className="etiqueta etiqueta--neutra">
            <Icone nome="calendario" tamanho={12} />
            {formatarDataExtenso(visita.data)}
          </span>
        )
      }
      acoes={
        <div className="barra-acoes">
          <Botao
            variante="contorno"
            icone="seta_esquerda"
            onClick={() => irParaEtapa("visita")}
          >
            Voltar
          </Botao>

          <Botao
            variante="destaque"
            iconeFim="seta_direita"
            onClick={() => irParaEtapa("resumo")}
          >
            Finalizar relatório
          </Botao>
        </div>
      }
    >
      {agenciasComercial.length === 0 ? (
        <div className="estado-vazio">
          <Icone nome="predio" tamanho={22} />
          <span className="estado-vazio__titulo">
            Nenhuma agência para detalhar
          </span>
          <span className="estado-vazio__texto">
            Volte à etapa Visita e informe pelo menos uma agência visitada.
          </span>
          <Botao
            variante="contorno"
            pequeno
            icone="seta_esquerda"
            onClick={() => irParaEtapa("visita")}
          >
            Voltar para Visita
          </Botao>
        </div>
      ) : (
        <>
          <p className="aviso">
            <Icone nome="informacao" tamanho={16} className="aviso__icone" />
            <span className="aviso__conteudo">
              <strong>Preenchimento opcional, mas valioso.</strong>
              <span>
                Quanto mais completo o termômetro, melhor a leitura de risco de
                churn pela gestão.
              </span>
            </span>
          </p>

          <div className="lista-blocos">
            {agenciasComercial.map((agencia, indice) => (
              <CartaoAgencia
                key={agencia.id}
                agencia={agencia}
                ordem={indice + 1}
                aoAlterar={(dados) =>
                  despachar({
                    tipo: "alterar-agencia-comercial",
                    id: agencia.id,
                    dados,
                  })
                }
              />
            ))}
          </div>
        </>
      )}
    </Painel>
  );
}
