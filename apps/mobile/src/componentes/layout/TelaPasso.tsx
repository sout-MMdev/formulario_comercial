// ================================================================
// TELA DE PASSO
// O molde de TODA tela do app: barra de progresso no topo, título
// em forma de pergunta, conteúdo rolável e a barra de ação FIXA
// na base — dentro da zona do polegar.
//
// Ter um molde único garante que nenhuma tela esqueça a safe area
// nem o espaço reservado para a barra de ação.
// ================================================================

import type { ReactNode } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { Icone } from "@/componentes/ui/Icone";
import "./TelaPasso.css";

interface PropsTelaPasso {
  /** Pergunta que dá nome à tela. */
  titulo: string;
  apoio?: string;
  /** Etiqueta pequena acima do título (ex.: "Relatório de Visita"). */
  etiqueta?: string;

  // Progresso
  indice: number;
  total: number;

  // Navegação
  temVoltar: boolean;
  aoVoltar: () => void;
  rotuloAvancar?: string;
  iconeAvancar?: "seta_direita" | "salvar" | "checar";
  aoAvancar?: () => void;
  podeAvancar?: boolean;
  /** Motivo de o avanço estar bloqueado — mostrado acima da barra. */
  motivoBloqueio?: string | null;

  /** Direção da animação de entrada. */
  sentido?: "avancar" | "voltar";

  children: ReactNode;
}

export function TelaPasso({
  titulo,
  apoio,
  etiqueta,
  indice,
  total,
  temVoltar,
  aoVoltar,
  rotuloAvancar = "Continuar",
  iconeAvancar = "seta_direita",
  aoAvancar,
  podeAvancar = true,
  motivoBloqueio,
  sentido = "avancar",
  children,
}: PropsTelaPasso) {
  const progresso = total > 1 ? ((indice + 1) / total) * 100 : 100;

  return (
    <div className="tela">
      {/* ── Progresso ─────────────────────────────────────────── */}
      <div className="tela__progresso">
        <div className="tela__barra">
          <span
            className="tela__barra-preenchida"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <span className="tela__contador">
          {indice + 1} de {total}
        </span>
      </div>

      {/* ── Conteúdo ──────────────────────────────────────────── */}
      <main
        className={`tela__corpo ${sentido === "voltar" ? "anim-voltar" : "anim-avancar"}`}
      >
        <header className="tela__cabecalho">
          {etiqueta && <span className="tela__etiqueta">{etiqueta}</span>}
          <h1 className="tela__titulo">{titulo}</h1>
          {apoio && <p className="tela__apoio">{apoio}</p>}
        </header>

        <div className="tela__conteudo">{children}</div>
      </main>

      {/* ── Ações — fixas na base ─────────────────────────────── */}
      <footer className="tela__acoes">
        {motivoBloqueio && !podeAvancar && (
          <p className="tela__bloqueio">
            <Icone nome="informacao" tamanho={15} />
            {motivoBloqueio}
          </p>
        )}

        <div className="tela__botoes">
          {temVoltar && (
            <Botao
              variante="contorno"
              icone="seta_esquerda"
              onClick={aoVoltar}
              className="tela__voltar"
              aria-label="Voltar"
            />
          )}

          {aoAvancar && (
            <Botao
              variante={iconeAvancar === "salvar" ? "destaque" : "primario"}
              iconeFim={iconeAvancar === "salvar" ? undefined : iconeAvancar}
              icone={iconeAvancar === "salvar" ? "salvar" : undefined}
              onClick={aoAvancar}
              disabled={!podeAvancar}
              largo
            >
              {rotuloAvancar}
            </Botao>
          )}
        </div>
      </footer>
    </div>
  );
}
