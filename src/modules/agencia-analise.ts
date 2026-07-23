// ================================================================
// AGÊNCIA ANÁLISE — dados comerciais e termômetro de satisfação.
// Um bloco por agência visitada, sincronizado a partir da lista
// de agências preenchida na etapa Visita.
// Cria dois fieldsets por agência: comercial + termômetro.
// ================================================================

import {
  faturamentoAnualOpcoes,
  produtosAgencia,
  setoresAcao,
  listaAtendentes,
} from "../config/dados";
import { slugTexto } from "../utils/formatadores";
import type { AgenciaComercial, RegistroEstresse, AcaoAcordada } from "../types";
import { gerarHtmlCampoData, inicializarDataPicker } from "./data-picker";
import { gerarHtmlMultiSelect, inicializarMultiSelects } from "./multiselect";
import {
  gerarHtmlEstresseSetor,
  inicializarEstresseSetor,
  obterRegistroEmAndamento,
} from "./estresse";
import { observarReveals } from "./scroll-reveal";


// ── Helpers ──────────────────────────────────────────────────────

/**
 * Coleta os nomes das agências preenchidas na etapa Visita.
 */
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


// ── Geração de HTML ──────────────────────────────────────────────

/**
 * HTML do bloco de dados comerciais de uma agência.
 */
function gerarHtmlComercial(indice: number): string {
  let html = "";

  // Data de fundação
  html +=
    '<div class="campo">' +
      `<label for="data_fundacao_${indice}">Data de Fundação:</label>` +
      gerarHtmlCampoData({
        name: `agencia[${indice}][data_fundacao]`,
        id: `data_fundacao_${indice}`,
      }) +
    '</div>';

  // Faturamento anual
  html +=
    '<div class="campo">' +
      `<label for="faturamento_anual_${indice}">Faturamento Anual da Agência:</label>` +
      `<select id="faturamento_anual_${indice}" name="agencia[${indice}][faturamento_anual]" class="select-bonito">` +
        '<option value="">Selecione...</option>';

  faturamentoAnualOpcoes.forEach((opcao) => {
    html += `<option value="${opcao.value}">${opcao.label}</option>`;
  });

  html += '</select></div>';

  // Produtos
  html +=
    '<div class="campo">' +
      '<label>Produto que a agência mais vende:</label>' +
      gerarHtmlMultiSelect({
        name: `agencia[${indice}][produtos]`,
        opcoes: produtosAgencia,
        placeholder: "Selecione um ou mais produtos...",
      }) +
    '</div>';

  // Atendentes
  html +=
    '<div class="campo">' +
      '<label>Atendente de Preferência:</label>' +
      gerarHtmlMultiSelect({
        name: `agencia[${indice}][atendentes]`,
        opcoes: listaAtendentes,
        placeholder: "Selecione um ou mais atendentes...",
      }) +
    '</div>';

  return html;
}


/**
 * HTML do bloco de termômetro de sentimento de uma agência.
 */
function gerarHtmlTermometro(indice: number, nomeAgencia: string): string {
  let html = "";

  html += `<legend>SENTIMENTO: ${nomeAgencia || "Agência " + indice}</legend>`;

  // Estresse
  html +=
    '<div class="campo">' +
      '<label>Nível de Estresse:</label>' +
      '<p class="instrucoes-termometro">' +
        "Selecione o nível de estresse com o cliente e o risco de churn (perda da conta)." +
      '</p>' +
      gerarHtmlEstresseSetor(indice) +
    '</div>';

  // Ação acordada
  html +=
    '<div class="campo">' +
      '<label>Ação Acordada:</label>' +
      '<div class="opcoes-acao">';

  setoresAcao.forEach((setor) => {
    const setorId = slugTexto(setor);
    html +=
      '<div class="bloco-acao-setor">' +
        '<label class="opcao-checkbox">' +
          `<input type="checkbox" name="agencia[${indice}][acao_setores][]" ` +
            `value="${setor}" class="checkbox-acao">` +
          `<span>${setor}</span>` +
        '</label>' +
        `<textarea name="agencia[${indice}][acao_${setorId}]" rows="2" ` +
          `placeholder="O que foi combinado com ${setor}?" ` +
          'class="textarea-acao oculto"></textarea>' +
      '</div>';
  });

  html += '</div></div>';

  return html;
}


// ── Eventos ──────────────────────────────────────────────────────

/**
 * Liga os eventos de "Ação Acordada": cada checkbox abre seu textarea.
 */
function configurarEventosAcaoAcordada(bloco: HTMLElement): void {
  bloco
    .querySelectorAll<HTMLInputElement>(".checkbox-acao")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const textarea = checkbox
          .closest(".bloco-acao-setor")
          ?.querySelector<HTMLTextAreaElement>(".textarea-acao");

        if (!textarea) return;

        if (checkbox.checked) {
          textarea.classList.remove("oculto");
        } else {
          textarea.classList.add("oculto");
          textarea.value = "";
        }
      });
    });
}


// ── Sincronização etapa Visita → etapa Agências ──────────────────

/**
 * Reconstrói os blocos de Agências a partir da lista de
 * agências visitadas na etapa Visita.
 * Cria dois fieldsets por agência: comercial + termômetro.
 */
export function sincronizarAgenciasETermometro(): void {
  const nomes = obterNomesAgenciasVisitadas();
  if (nomes.length === 0) return;

  const container = document.getElementById("container-agencias-comercial");
  if (!container) return;

  container.innerHTML = "";

  nomes.forEach((nomeAgencia, posicao) => {
    const indice = posicao + 1;

    // Fieldset 1: Dados Comerciais
    const blocoComercial = document.createElement("fieldset");
    blocoComercial.classList.add("bloco-agencia-comercial");
    blocoComercial.setAttribute("data-indice", String(indice));
    blocoComercial.innerHTML =
      `<legend>${nomeAgencia || "Agência " + indice}</legend>` +
      gerarHtmlComercial(indice);

    container.appendChild(blocoComercial);
    configurarEventosAcaoAcordada(blocoComercial);
    inicializarEstresseSetor(blocoComercial);

    // Fieldset 2: Termômetro de Satisfação
    const blocoTermometro = document.createElement("fieldset");
    blocoTermometro.classList.add("bloco-agencia-termometro");
    blocoTermometro.setAttribute("data-indice", String(indice));
    blocoTermometro.innerHTML = gerarHtmlTermometro(indice, nomeAgencia);

    container.appendChild(blocoTermometro);
    configurarEventosAcaoAcordada(blocoTermometro);
    inicializarEstresseSetor(blocoTermometro);
  });

  // Inicializa componentes dinâmicos dentro do container
  inicializarMultiSelects(container);
  inicializarDataPicker(container);
  observarReveals(container);

  // Copia a data da etapa Visita para a etapa Agências
  const dataVisitaIso = document.getElementById("data_visita_iso") as HTMLInputElement | null;
  const dataAgenciasIso = document.getElementById("data_agencias_iso") as HTMLInputElement | null;
  const dataAgenciasTexto = document.getElementById("data_agencias") as HTMLInputElement | null;

  if (dataVisitaIso?.value && dataAgenciasIso) {
    dataAgenciasIso.value = dataVisitaIso.value;

    const dataVisitaTexto = document.getElementById("data_visita") as HTMLInputElement | null;
    if (dataVisitaTexto?.value && dataAgenciasTexto) {
      dataAgenciasTexto.value = dataVisitaTexto.value;
    }
  }
}


// ── Coleta de dados ──────────────────────────────────────────────

/**
 * Coleta os dados comerciais e de termômetro de cada agência.
 */
export function coletarAgenciasComercial(): AgenciaComercial[] {
  const agencias: AgenciaComercial[] = [];

  document
    .querySelectorAll<HTMLFieldSetElement>(".bloco-agencia-comercial")
    .forEach((blocoComercial) => {
      const legend = blocoComercial.querySelector("legend")?.textContent?.trim() || "";
      const nome = legend.replace(/^Agência \d+:\s*/, "").trim();
      const indice = blocoComercial.getAttribute("data-indice") || "0";

      // Data de fundação
      const dataFundacao =
        blocoComercial.querySelector<HTMLInputElement>(
          'input[name*="[data_fundacao]"]'
        )?.value.trim() || "";

      // Faturamento
      const selectFat = blocoComercial.querySelector<HTMLSelectElement>(
        'select[name*="[faturamento_anual]"]'
      );
      const faturamentoAnual = selectFat?.value || "";
      const faturamentoAnualLabel =
        selectFat && selectFat.selectedIndex > 0
          ? selectFat.options[selectFat.selectedIndex].textContent || ""
          : "";

      // Produtos
      const produtos: string[] = [];
      blocoComercial
        .querySelectorAll<HTMLInputElement>('input[name*="[produtos]"]:checked')
        .forEach((cb) => produtos.push(cb.value));

      // Atendentes
      const atendentes: string[] = [];
      blocoComercial
        .querySelectorAll<HTMLInputElement>('input[name*="[atendentes]"]:checked')
        .forEach((cb) => atendentes.push(cb.value));

      // Termômetro (no bloco separado com mesmo data-indice)
      const blocoTermometro = document.querySelector<HTMLFieldSetElement>(
        `.bloco-agencia-termometro[data-indice="${indice}"]`
      );

      // Estresse: registros salvos + registro em andamento
      let estresses: RegistroEstresse[] = [];

      let inputRegistros = blocoComercial.querySelector<HTMLInputElement>(
        ".estresse-registros-json"
      );
      if (!inputRegistros && blocoTermometro) {
        inputRegistros = blocoTermometro.querySelector<HTMLInputElement>(
          ".estresse-registros-json"
        );
      }

      if (inputRegistros) {
        try {
          estresses = JSON.parse(inputRegistros.value || "[]") as RegistroEstresse[];
        } catch {
          estresses = [];
        }
      }

      const blocoParaAndamento = blocoTermometro || blocoComercial;
      const emAndamento = obterRegistroEmAndamento(blocoParaAndamento);
      if (emAndamento) {
        estresses = [...estresses, emAndamento];
      }

      // Ação acordada
      const acoes: AcaoAcordada[] = [];
      const blocoParaAcoes = blocoTermometro || blocoComercial;

      blocoParaAcoes
        .querySelectorAll<HTMLDivElement>(".bloco-acao-setor")
        .forEach((blocoSetor) => {
          const cb = blocoSetor.querySelector<HTMLInputElement>(".checkbox-acao");
          if (cb?.checked) {
            const txt =
              blocoSetor.querySelector<HTMLTextAreaElement>(".textarea-acao")
                ?.value.trim() || "";
            acoes.push({ setor: cb.value, detalhe: txt });
          }
        });

      if (nome) {
        agencias.push({
          nome,
          dataFundacao,
          faturamentoAnual,
          faturamentoAnualLabel,
          produtos,
          atendentes,
          estresses,
          acoes,
        });
      }
    });

  return agencias;
}