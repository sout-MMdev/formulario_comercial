// ================================================================
// PASSO — AGÊNCIAS VISITADAS
// Lista simples com adicionar/remover. Cada nome vira um bloco de
// análise no passo seguinte — a mesma regra do desktop.
// ================================================================

import { Botao, BotaoIcone } from "@/componentes/ui/Botao";
import { Icone } from "@/componentes/ui/Icone";
import { TelaPasso } from "@/componentes/layout/TelaPasso";
import { CampoAgencia } from "@/componentes/campos/CampoAgencia";
import { ROTULOS_FLUXO } from "@cativa/nucleo/config";
import { validarVisita } from "@cativa/nucleo/regras";
import { useFormulario } from "@/contexto/useFormulario";
import { PASSOS } from "@/navegacao/passos";
import "./AgenciasVisitadas.css";

export function AgenciasVisitadas() {
  const {
    estado,
    despachar,
    avancar,
    voltar,
    indicePasso,
    sequencia,
    sentido,
    temAnterior,
    agenciasVisitadas,
  } = useFormulario();

  const { agencias } = estado.visita;
  const validacao = validarVisita(estado.visita);

  return (
    <TelaPasso
      etiqueta={ROTULOS_FLUXO.visita}
      titulo={PASSOS.agencias.titulo}
      apoio={PASSOS.agencias.apoio}
      indice={indicePasso}
      total={sequencia.length}
      sentido={sentido}
      temVoltar={temAnterior}
      aoVoltar={voltar}
      aoAvancar={avancar}
      podeAvancar={validacao.valido}
      motivoBloqueio={validacao.erro}
      rotuloAvancar={
        agenciasVisitadas.length > 1
          ? `Detalhar ${agenciasVisitadas.length} agências`
          : "Continuar"
      }
    >
      <div className="agencias-lista">
        {agencias.map((agencia, indice) => (
          <div key={agencia.id} className="agencia-linha">
            <span className="agencia-linha__ordem">{indice + 1}</span>

            <div className="agencia-linha__campo">
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
            </div>

            <BotaoIcone
              icone="lixeira"
              rotulo={`Remover agência ${indice + 1}`}
              perigo
              disabled={agencias.length <= 1}
              onClick={() =>
                despachar({
                  tipo: "remover-agencia-visitada",
                  id: agencia.id,
                })
              }
            />
          </div>
        ))}
      </div>

      <Botao
        variante="adicionar"
        icone="mais"
        onClick={() => despachar({ tipo: "adicionar-agencia-visitada" })}
      >
        Adicionar outra agência
      </Botao>

      {agenciasVisitadas.length > 0 && (
        <p className="aviso anim-surgir">
          <Icone nome="informacao" tamanho={18} className="aviso__icone" />
          <span>
            No próximo passo você detalha cada uma:{" "}
            <strong>{agenciasVisitadas.join(", ")}</strong>.
          </span>
        </p>
      )}
    </TelaPasso>
  );
}
