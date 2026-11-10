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
import { TelaLogin } from "@/login/TelaLogin";
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

  // TEMPORÁRIO (etapa 1 do login) — sai na etapa 3 (docs/planejamento/login-mobile.md §7).
  // `?login` mostra a tela com um login de teste; `?login=seu@email`
  // simula um e-mail lembrado; "erro@teste.com" simula senha errada.
  const parametros = new URLSearchParams(window.location.search);
  if (parametros.has("login")) {
    return (
      <TelaLogin
        emailLembrado={parametros.get("login") ?? ""}
        aoEntrar={async ({ email }) => {
          await new Promise((esperar) => setTimeout(esperar, 800));
          if (email === "erro@teste.com") {
            return {
              ok: false,
              motivo: "credenciais",
              mensagem: "E-mail ou senha incorretos.",
            };
          }
          window.location.assign("/"); // "entrou": segue para o app
          return {
            ok: true,
            usuario: { nome: "TESTE", email, precisaTrocarSenha: false },
          };
        }}
      />
    );
  }

  const Tela = TELAS[passo];

  return (
    <>
      {carregando && <Splash aoConcluir={() => setCarregando(false)} />}
      <Tela />
    </>
  );
}
