// ================================================================
// PASSO — DATA DA VISITA
// Uma pergunta só, com os atalhos Hoje/Ontem dentro do seletor.
// ================================================================

import { Campo } from "@/componentes/ui/Campo";
import { Icone } from "@/componentes/ui/Icone";
import { SeletorData } from "@/componentes/ui/SeletorData";
import { TelaPasso } from "@/componentes/layout/TelaPasso";
import { ROTULOS_FLUXO } from "@cativa/nucleo/config";
import { formatarDataExtenso } from "@cativa/nucleo/utils";
import { useFormulario } from "@/contexto/useFormulario";
import { PASSOS } from "@/navegacao/passos";

export function DataVisita() {
  const {
    estado,
    despachar,
    avancar,
    voltar,
    indicePasso,
    sequencia,
    sentido,
    temAnterior,
  } = useFormulario();

  const { data } = estado.visita;

  return (
    <TelaPasso
      etiqueta={ROTULOS_FLUXO.visita}
      titulo={PASSOS["data-visita"].titulo}
      apoio={PASSOS["data-visita"].apoio}
      indice={indicePasso}
      total={sequencia.length}
      sentido={sentido}
      temVoltar={temAnterior}
      aoVoltar={voltar}
      aoAvancar={avancar}
      podeAvancar={Boolean(data)}
      motivoBloqueio="Escolha a data da visita para continuar."
    >
      <Campo rotulo="Data da visita" obrigatorio>
        {(id) => (
          <SeletorData
            id={id}
            valor={data}
            aoAlterar={(novaData) =>
              despachar({ tipo: "definir-data-visita", data: novaData })
            }
          />
        )}
      </Campo>

      {data && (
        <p className="aviso aviso--sucesso anim-surgir">
          <Icone nome="sucesso" tamanho={18} className="aviso__icone" />
          <span>
            Visita registrada em <strong>{formatarDataExtenso(data)}</strong>.
          </span>
        </p>
      )}
    </TelaPasso>
  );
}
