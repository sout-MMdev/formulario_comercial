// ================================================================
// APP
// Monta a página: splash → cabeçalho → trilha + aba atual → rodapé.
//
// O mapa ABAS é o único lugar que liga o nome de uma etapa ao seu
// componente. Aba nova = uma linha aqui.
// ================================================================

import { useState, type ComponentType } from "react";
import { Agencias, Despesas, Identificacao, Resumo, Visita } from "@/abas";
import { Cabecalho, Rodape, Splash, TrilhaEtapas } from "@/componentes/layout";
import { useFormulario } from "@/contexto/useFormulario";
import type { NomeEtapa } from "@cativa/nucleo/tipos";
import "./App.css";

const ABAS: Record<NomeEtapa, ComponentType> = {
  identificacao: Identificacao,
  visita: Visita,
  agencias: Agencias,
  despesas: Despesas,
  resumo: Resumo,
};

export function App() {
  const [carregando, setCarregando] = useState(true);
  const { estado, etapasVisiveis, irParaEtapa } = useFormulario();

  const AbaAtual = ABAS[estado.etapaAtual];

  return (
    <>
      {carregando && <Splash aoConcluir={() => setCarregando(false)} />}

      <div className="app">
        <Cabecalho
          nomeExecutivo={estado.identificacao.nome}
          emailExecutivo={estado.identificacao.email}
        />

        <main className="app__conteudo">
          <TrilhaEtapas
            etapas={etapasVisiveis}
            etapaAtual={estado.etapaAtual}
            aoEscolher={irParaEtapa}
          />

          {/* A key força a remontagem ao trocar de aba — a animação
              de entrada roda de novo e a rolagem começa do topo. */}
          <div className="app__aba" key={estado.etapaAtual}>
            <AbaAtual />
          </div>
        </main>

        <Rodape />
      </div>
    </>
  );
}
