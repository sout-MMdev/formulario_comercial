// ================================================================
// RESUMO — monta a pré-visualização do dia, renderiza os dias
// salvos no painel e coordena o salvar/limpar.
// ================================================================

import { formatarData, formatarMoeda, resumoLinha } from "../utils/formatadores";
import { coletarTrajetos, coletarDespesas, limparFormulario } from "./despesas";
import { coletarAgenciasComercial } from "./agencia-analise";
import { carregarDiasSalvos, salvarDia, excluirDia, limparTodosDias } from "./storage";
import { irParaEtapa, obterFluxosAdicionados, resetarFluxo } from "./fluxo";
import { observarReveals } from "./scroll-reveal";


// ── Helpers de coleta ────────────────────────────────────────────

/** Coleta os nomes das agências preenchidas na etapa Visita. */
function obterNomesAgenciasVisitadas(): string[] {
  const nomes: string[] = [];
  document
    .querySelectorAll<HTMLInputElement>(
      ".container-agencias-dia .linha-agencia input"
    )
    .forEach((input) => {
      const valor = input.value.trim();
      if (valor) nomes.push(valor);
    });
  return nomes;
}


// ── Montar resumo ────────────────────────────────────────────────

/**
 * Monta a pré-visualização completa do dia atual.
 * Regras de negócio:
 *   - KM rodado sempre soma.
 *   - Despesa no Cartão Pessoal soma (reembolso ao executivo).
 *   - Abastecimento no Cartão Clara desconta do total.
 *   - Outras despesas no Cartão Clara são informativas.
 */
export function montarResumo(): void {
  const resumoDiv = document.getElementById("resumo-conteudo");
  if (!resumoDiv) return;

  const trajetos          = coletarTrajetos();
  const agenciasVisitadas = obterNomesAgenciasVisitadas();
  const agenciasComercial = coletarAgenciasComercial();
  const despesas          = coletarDespesas();

  // Totais
  const totalKm = trajetos.reduce((a, t) => a + (t.reembolsoKm || 0), 0);

  const totalPessoal = despesas
    .filter((d) => d.descricao === "Cartão Pessoal")
    .reduce((a, d) => a + (d.valor || 0), 0);

  const totalAbastecimentoClara = despesas
    .filter((d) => d.descricao === "Cartão Clara" && d.cidade === "Abastecimento")
    .reduce((a, d) => a + (d.valor || 0), 0);

  const totalFinal = totalKm + totalPessoal - totalAbastecimentoClara;

  let html = '<div class="resumo-dia">';

  // ── Cards de totais ────────────────────────────────────
  if (despesas.length > 0) {
    html += '<div class="resumo-totais">';
    html +=
      '<div class="resumo-total-item">' +
        '<span class="resumo-total-label">Reembolso KM</span>' +
        '<span class="resumo-total-valor">' + formatarMoeda(totalKm) + '</span>' +
      '</div>';
    html +=
      '<div class="resumo-total-item">' +
        '<span class="resumo-total-label">Despesas (Cartão Pessoal)</span>' +
        '<span class="resumo-total-valor">' + formatarMoeda(totalPessoal) + '</span>' +
      '</div>';
    html +=
      '<div class="resumo-total-item resumo-total-desconto">' +
        '<span class="resumo-total-label">Abastecimento Cartão Clara (−)</span>' +
        '<span class="resumo-total-valor">' + formatarMoeda(totalAbastecimentoClara) + '</span>' +
      '</div>';
    html +=
      '<div class="resumo-total-item resumo-total-destaque">' +
        '<span class="resumo-total-label">Total a Reembolsar</span>' +
        '<span class="resumo-total-valor">' + formatarMoeda(totalFinal) + '</span>' +
      '</div>';
    html += '</div>';
  }

  // ── Seção: Visita ──────────────────────────────────────
  if (trajetos.length > 0 || agenciasVisitadas.length > 0) {
    html += '<div class="resumo-secao">';
    html += '<div class="resumo-secao-titulo">🚗 Visita</div>';

    trajetos.forEach((t, i) => {
      html += '<div class="resumo-card">';
      html += '<div class="resumo-card-header">Trajeto ' + (i + 1) + ' — ' + formatarData(t.data) + '</div>';
      html += '<div class="resumo-card-corpo">';
      html += resumoLinha("Ponto de partida", t.partida || "—");
      html += resumoLinha("Destino final", t.destino || "—");
      html += resumoLinha("KM rodado", (t.km || 0) + " km");
      html += resumoLinha("Valor reembolso", formatarMoeda(t.reembolsoKm));
      html += '</div></div>';
    });

    if (agenciasVisitadas.length > 0) {
      html += '<div class="resumo-card"><div class="resumo-card-corpo">';
      html += resumoLinha("Agências visitadas", agenciasVisitadas.join(" · "));
      html += '</div></div>';
    }
    html += '</div>';
  }

  // ── Seção: Agências ────────────────────────────────────
  if (agenciasComercial.length > 0) {
    html += '<div class="resumo-secao">';
    html += '<div class="resumo-secao-titulo">🏢 Agências</div>';

    agenciasComercial.forEach((a, i) => {
      html += '<div class="resumo-card">';
      html += '<div class="resumo-card-header">' + (a.nome || "Agência " + (i + 1)) + '</div>';
      html += '<div class="resumo-card-corpo">';

      if (a.dataFundacao) html += resumoLinha("Fundação", formatarData(a.dataFundacao));
      if (a.faturamentoAnualLabel) html += resumoLinha("Faturamento anual", a.faturamentoAnualLabel);
      if (a.produtos.length > 0) html += resumoLinha("Produtos", a.produtos.join(" · "));
      if (a.atendentes.length > 0) html += resumoLinha("Atendente(s)", a.atendentes.join(" · "));

      if (a.estresses.length > 0) {
        html += '<hr style="margin: 12px 0;">';
        html += '<strong style="display:block;margin-bottom:8px;">Termômetro de Satisfação</strong>';
        a.estresses.forEach((es) => {
          const setoresTexto = es.setores.join(" · ");
          const texto = setoresTexto + (es.descricao ? " — " + es.descricao : "");
          html += resumoLinha("Estresse " + es.nivel, texto);
        });
      }

      if (a.acoes.length > 0) {
        a.acoes.forEach((ac) => {
          html += resumoLinha("Ação — " + ac.setor, ac.detalhe || "(sem detalhes)");
        });
      }

      html += '</div></div>';
    });
    html += '</div>';
  }

  // ── Seção: Despesas ────────────────────────────────────
  if (despesas.length > 0) {
    html += '<div class="resumo-secao">';
    html += '<div class="resumo-secao-titulo">💰 Despesas</div>';

    despesas.forEach((d, i) => {
      const cartao = d.descricao;
      const categoria = d.cidade;
      const ehAbastecimentoClara = cartao === "Cartão Clara" && categoria === "Abastecimento";

      let situacao: string;
      if (cartao === "Cartão Pessoal") {
        situacao = "Reembolsado (+)";
      } else if (ehAbastecimentoClara) {
        situacao = "Descontado (−)";
      } else {
        situacao = "Já pago pela empresa (informativo)";
      }

      html += '<div class="resumo-card">';
      html += '<div class="resumo-card-header">Despesa ' + (i + 1) + ' — ' + formatarData(d.data) + '</div>';
      html += '<div class="resumo-card-corpo">';
      html += resumoLinha("Cartão", cartao || "—");
      html += resumoLinha("Categoria", categoria || "—");
      html += resumoLinha("Valor", formatarMoeda(d.valor));
      html += resumoLinha("Situação", situacao);
      if (d.nomeArquivo) {
        html += resumoLinha("Arquivo anexado", "📎 " + d.nomeArquivo);
      }
      html += '</div></div>';
    });
    html += '</div>';
  }

  if (trajetos.length === 0 && agenciasVisitadas.length === 0 &&
      agenciasComercial.length === 0 && despesas.length === 0) {
    html += '<p style="color:#999;text-align:center;padding:24px;">Confira os dados que foram enviados acima.</p>';
  }

  html += '</div>';
  resumoDiv.innerHTML = html;
  observarReveals(resumoDiv);
}


// ── Dias salvos ──────────────────────────────────────────────────

/**
 * Exclui um dia salvo (com confirmação).
 */
function excluirDiaSalvo(id: number): void {
  if (!confirm("Deseja realmente excluir este dia?")) return;
  excluirDia(id);
  renderizarDiasSalvos();
}

/**
 * Renderiza todos os dias salvos em TODOS os painéis
 * com classe .painel-dias-salvos.
 */
export function renderizarDiasSalvos(): void {
  const paineis = document.querySelectorAll<HTMLDivElement>(".painel-dias-salvos");
  if (paineis.length === 0) return;

  const diasSalvos = carregarDiasSalvos();

  let html: string;

  if (diasSalvos.length === 0) {
    html =
      '<p class="painel-vazio">Nenhum dia salvo ainda. ' +
      'Preencha o formulário e clique em "Salvar o seu dia" para guardar.</p>';
  } else {
    html = '<div class="resumo-secao">';
    html += '<div class="resumo-secao-titulo">📋 Dias salvos esta semana</div>';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    diasSalvos.forEach((dia: any) => {
      const trajetosDia = dia.trajetos || [];
      const primeiroTrajeto = trajetosDia[0] || null;
      const dataFormatada = primeiroTrajeto?.data
        ? formatarData(primeiroTrajeto.data)
        : "Data não informada";

      const despesasDia = dia.despesas || [];

      const totalKmDia = trajetosDia.reduce(
        (a: number, t: any) => a + (parseFloat(t.reembolso || t.reembolsoKm) || 0), 0
      );

      const totalPessoalDia = despesasDia
        .filter((d: any) => d.cartao === "Cartão Pessoal" || d.descricao === "Cartão Pessoal")
        .reduce((a: number, d: any) => a + (parseFloat(d.reembolso || d.valor) || 0), 0);

      const totalAbastClaraDia = despesasDia
        .filter((d: any) =>
          (d.cartao === "Cartão Clara" || d.descricao === "Cartão Clara") &&
          (d.categoria === "Abastecimento" || d.cidade === "Abastecimento")
        )
        .reduce((a: number, d: any) => a + (parseFloat(d.reembolso || d.valor) || 0), 0);

      const totalFinalDia = totalKmDia + totalPessoalDia - totalAbastClaraDia;

      const agenciasDia: string[] = dia.agenciasVisitadas || [];

      html += '<div class="resumo-card resumo-card-salvo">';
      html += '<div class="resumo-card-header resumo-card-header-salvo">';
      html += '📅 ' + dataFormatada + ' — salvo em ' + (dia.salvadoEm || "");
      html += '<button type="button" class="btn-excluir-dia" data-id="' + dia.id + '">🗑 Excluir</button>';
      html += '</div>';

      html += '<div class="resumo-card-corpo">';

      const rotasDia = trajetosDia
        .filter((t: any) => t.partida)
        .map((t: any) => t.partida + " → " + (t.destino || "—"));

      if (rotasDia.length > 0) {
        html += resumoLinha("Rota" + (rotasDia.length > 1 ? "s" : ""), rotasDia.join(" · "));
      }

      if (trajetosDia.length > 0) {
        const totalKmRodado = trajetosDia.reduce(
          (a: number, t: any) => a + (parseFloat(t.km) || 0), 0
        );
        html += resumoLinha("KM / Reembolso", totalKmRodado + " km — " + formatarMoeda(totalKmDia));
      }

      if (totalPessoalDia > 0) {
        html += resumoLinha("Despesas (Cartão Pessoal)", formatarMoeda(totalPessoalDia));
      }
      if (totalAbastClaraDia > 0) {
        html += resumoLinha("Abastecimento Cartão Clara (−)", formatarMoeda(totalAbastClaraDia));
      }
      if (trajetosDia.length > 0 || despesasDia.length > 0) {
        html += resumoLinha("Total a Reembolsar", "<strong>" + formatarMoeda(totalFinalDia) + "</strong>");
      }
      if (agenciasDia.length > 0) {
        html += resumoLinha("Agências", agenciasDia.join(" · "));
      }

      html += '<div class="painel-dia-contadores">';
      if (dia.agenciasComercial?.length > 0) html += "📊 " + dia.agenciasComercial.length + " agência(s)  ";
      if (despesasDia.length > 0) html += "💰 " + despesasDia.length + " despesa(s)";
      html += '</div>';

      html += '</div></div>';
    });

    html += '</div>';
  }

  paineis.forEach((painel) => {
    painel.innerHTML = html;

    painel
      .querySelectorAll<HTMLButtonElement>(".btn-excluir-dia")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.getAttribute("data-id") || "0", 10);
          excluirDiaSalvo(id);
        });
      });

    observarReveals(painel);
  });
}


// ── Salvar dia ───────────────────────────────────────────────────

/**
 * Coleta todos os dados, salva no storage, limpa o formulário
 * e volta para a etapa de Identificação.
 */
export function salvarDiaCompleto(): void {
  const trajetos          = coletarTrajetos();
  const agenciasVisitadas = obterNomesAgenciasVisitadas();
  const agenciasComercial = coletarAgenciasComercial();
  const despesas          = coletarDespesas();

  if (trajetos.length === 0 && agenciasVisitadas.length === 0) {
    alert("Preencha pelo menos a data da visita ou o trajeto do dia antes de salvar.");
    return;
  }

  // Salva usando a estrutura compatível com o formato existente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registro: any = {
    id:                Date.now(),
    salvadoEm:         new Date().toLocaleString("pt-BR"),
    fluxos:            obterFluxosAdicionados().slice(),
    trajetos,
    agenciasVisitadas,
    agenciasComercial,
    despesas,
  };

  salvarDia(registro);

  alert(
    "✅ Dia salvo com sucesso!\n\n" +
    "• Agências visitadas: " + agenciasVisitadas.length + "\n" +
    "• Despesas: "           + despesas.length + "\n\n" +
    "Pode fechar o app e continuar depois."
  );

  limparFormulario();
  resetarFluxo();

  // Esconde a barra de progresso
  const nav = document.querySelector<HTMLElement>(".progresso");
  if (nav) nav.classList.add("oculto");

  irParaEtapa("identificacao");
}


/**
 * Limpa todos os dias salvos (após envio do relatório semanal).
 */
export function limparDiasSalvosStorage(): void {
  limparTodosDias();
  renderizarDiasSalvos();
}