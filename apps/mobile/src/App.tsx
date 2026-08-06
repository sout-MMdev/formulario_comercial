// ================================================================
// APP MOBILE
// Splash → passo atual. Não existe menu nem abas: a navegação é a
// própria sequência de perguntas.
//
// O mapa TELAS é o único lugar que liga um passo ao seu componente.
// Passo novo = uma linha aqui e uma em navegacao/passos.ts.
// ================================================================

import { useState, type ComponentType } from "react";
import { Splash } from "@/componentes/layout/Splash";
import { useFormulario } from "@/contexto/useFormulario";
import type { NomePasso } from "@/navegacao/passos";
import { AgenciasVisitadas } from "@/passos/AgenciasVisitadas";
import { Analise } from "@/passos/Analise";
import { DataVisita } from "@/passos/DataVisita";
import { Executivo } from "@/passos/Executivo";
import { Gastos } from "@/passos/Gastos";
import { Relatorio } from "@/passos/Relatorio";
import { Resumo } from "@/passos/Resumo";
import { Trajetos } from "@/passos/Trajetos";

const TELAS: Record<NomePasso, ComponentType> = {
  executivo: Executivo,
  relatorio: Relatorio,
  "data-visita": DataVisita,
  agencias: AgenciasVisitadas,
  analise: Analise,
  trajetos: Trajetos,
  gastos: Gastos,
  resumo: Resumo,
};

export function App() {
  const [carregando, setCarregando] = useState(true);
  const { passo } = useFormulario();

  const Tela = TELAS[passo];

  return (
    <>
      {carregando && <Splash aoConcluir={() => setCarregando(false)} />}
      <Tela />
    </>
  );
}
