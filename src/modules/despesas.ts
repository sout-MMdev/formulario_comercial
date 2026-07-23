// ================================================================
// DESPESAS — blocos de trajeto, blocos de despesa, linhas de
// agência visitada, cálculo de reembolso de KM e botões de
// adicionar. Cobre as etapas Visita e Despesas do formulário.
// ================================================================

import {
  TARIFA_KM_PADRAO,
  TARIFA_KM_ESPECIAL,
  executivosTarifaEspecial,
} from "../config/dados";
import type { Despesa, TrajetoDespesa } from "../types";
import { gerarHtmlCampoData, inicializarDataPicker } from "./data-picker";
import { configurarAutocompleteCidade } from "./cidades";
import { configurarAutocompleteAgencia } from "./agencias";
import { observarReveals } from "./scroll-reveal";


// ── Contadores ───────────────────────────────────────────────────

let totalTrajetos = 1;
let totalDespesas = 1;


// ── Cálculo de KM ────────────────────────────────────────────────

/**
 * Lê o KM digitado, escolhe a tarifa do executivo
 * e preenche o campo de reembolso do mesmo bloco.
 */
function calcularReembolsoKm(inputKm: HTMLInputElement): void {
  const selectNome = document.getElementById("nome_executivo") as HTMLSelectElement | null;
  const nomeExecutivo = selectNome?.value.trim() || "";

  const kmDigitado = parseFloat(inputKm.value);
  if (!kmDigitado || kmDigitado <= 0) return;

  const tarifa = executivosTarifaEspecial.has(nomeExecutivo)
    ? TARIFA_KM_ESPECIAL
    : TARIFA_KM_PADRAO;

  const totalReembolso = (kmDigitado * tarifa).toFixed(2);

  const blocoTrajeto = inputKm.closest("fieldset");
  if (!blocoTrajeto) return;

  const inputReembolso = blocoTrajeto.querySelector<HTMLInputElement>(
    'input[name*="reembolso_km"]'
  );
  if (inputReembolso) {
    inputReembolso.value = totalReembolso;
  }
}

/**
 * Liga o recálculo a cada tecla digitada no campo de KM.
 */
export function configurarCalculoKm(inputKm: HTMLInputElement): void {
  inputKm.addEventListener("input", () => {
    calcularReembolsoKm(inputKm);
  });
}


// ── Linhas de agência (etapa Visita) ─────────────────────────────

/**
 * Adiciona uma nova linha de agência dentro de um container.
 */
function adicionarLinhaAgencia(containerAgencias: HTMLElement): void {
  const novaLinha = document.createElement("div");
  novaLinha.classList.add("linha-agencia");
  novaLinha.innerHTML =
    '<input type="text" name="visita[agencias][]" ' +
      'class="input-agencia" ' +
      'placeholder="Nome da agência visitada" required>' +
    '<button type="button" class="btn-remover-agencia" title="Remover agência">✕</button>';

  containerAgencias.appendChild(novaLinha);

  novaLinha
    .querySelector(".btn-remover-agencia")!
    .addEventListener("click", () => novaLinha.remove());

  const novoInput = novaLinha.querySelector<HTMLInputElement>("input")!;
  novoInput.focus();
  configurarAutocompleteAgencia(novoInput);
}


// ── Eventos de despesa ───────────────────────────────────────────

/**
 * Ao escolher o cartão, mostra a categoria do gasto e,
 * se for Cartão Pessoal, exige o anexo da nota fiscal.
 */
function configurarEventosDespesa(bloco: HTMLElement): void {
  const selectCartao = bloco.querySelector<HTMLSelectElement>(".select-cartao");
  const campoCategoria = bloco.querySelector<HTMLDivElement>(".campo-categoria-despesa");
  const campoAnexo = bloco.querySelector<HTMLDivElement>(".campo-comprovante-despesa");

  if (!selectCartao || !campoCategoria || !campoAnexo) return;

  const selectCategoria = campoCategoria.querySelector<HTMLSelectElement>(".select-bonito");
  const inputAnexo = campoAnexo.querySelector<HTMLInputElement>('input[type="file"]');

  selectCartao.addEventListener("change", () => {
    if (selectCartao.value === "") {
      campoCategoria.classList.add("oculto");
      campoAnexo.classList.add("oculto");
      if (selectCategoria) {
        selectCategoria.required = false;
        selectCategoria.value = "";
      }
      if (inputAnexo) {
        inputAnexo.required = false;
        inputAnexo.value = "";
      }
      return;
    }

    campoCategoria.classList.remove("oculto");
    if (selectCategoria) selectCategoria.required = true;

    if (selectCartao.value === "Cartão Pessoal") {
      campoAnexo.classList.remove("oculto");
      if (inputAnexo) inputAnexo.required = true;
    } else {
      campoAnexo.classList.add("oculto");
      if (inputAnexo) {
        inputAnexo.required = false;
        inputAnexo.value = "";
      }
    }
  });
}


// ── Blocos dinâmicos ─────────────────────────────────────────────

/**
 * Adiciona um bloco de trajeto (etapa Despesas).
 */
function adicionarBlocoTrajeto(): void {
  totalTrajetos++;
  const indice = totalTrajetos;
  const container = document.getElementById("container-trajetos");
  if (!container) return;

  const novoBloco = document.createElement("fieldset");
  novoBloco.classList.add("bloco-trajeto");
  novoBloco.setAttribute("data-indice", String(indice));

  novoBloco.innerHTML =
    `<legend>Trajeto ${indice}</legend>` +

    '<div class="campo">' +
      '<label>Data:</label>' +
      gerarHtmlCampoData({ name: `trajeto[${indice}][data]`, required: true }) +
    '</div>' +

    '<div class="campo">' +
      '<label>Ponto de Partida:</label>' +
      `<input type="text" name="trajeto[${indice}][partida]" ` +
        'class="input-cidade" placeholder="Digite o nome da cidade..." ' +
        'autocomplete="off" required>' +
      '<ul class="lista-cidades oculto"></ul>' +
    '</div>' +

    '<div class="campo">' +
      '<label>Destino Final:</label>' +
      `<input type="text" name="trajeto[${indice}][destino]" ` +
        'class="input-cidade" placeholder="Digite o nome da cidade..." ' +
        'autocomplete="off" required>' +
      '<ul class="lista-cidades oculto"></ul>' +
    '</div>' +

    '<div class="campo">' +
      '<label>KM Total Rodado:</label>' +
      `<input type="number" name="trajeto[${indice}][km]" ` +
        'placeholder="Ex: 45" min="0" required>' +
    '</div>' +

    '<div class="campo">' +
      '<label>Valor Total Reembolso (R$):</label>' +
      `<input type="number" name="trajeto[${indice}][reembolso_km]" ` +
        'placeholder="Calculado automaticamente" step="0.01" min="0" readonly>' +
    '</div>';

  container.appendChild(novoBloco);

  // Liga KM
  const inputKm = novoBloco.querySelector<HTMLInputElement>('input[name*="[km]"]');
  if (inputKm) configurarCalculoKm(inputKm);

  // Liga cidades
  novoBloco
    .querySelectorAll<HTMLInputElement>(".input-cidade")
    .forEach((input) => configurarAutocompleteCidade(input));

  observarReveals(novoBloco);
  inicializarDataPicker(novoBloco);
  novoBloco.scrollIntoView({ behavior: "smooth", block: "start" });
}


/**
 * Adiciona um bloco de despesa (etapa Despesas).
 */
function adicionarBlocoDespesa(): void {
  totalDespesas++;
  const indice = totalDespesas;
  const container = document.getElementById("container-despesas");
  if (!container) return;

  const novoBloco = document.createElement("fieldset");
  novoBloco.classList.add("bloco-despesa");
  novoBloco.setAttribute("data-indice", String(indice));

  novoBloco.innerHTML =
    `<legend>Despesa ${indice}</legend>` +

    '<div class="campo">' +
      '<label>Data:</label>' +
      gerarHtmlCampoData({ name: `despesa[${indice}][data]`, required: true }) +
    '</div>' +

    '<div class="campo">' +
      '<label>Cartão:</label>' +
      `<select name="despesa[${indice}][cartao]" class="select-cartao" required>` +
        '<option value="">Selecione...</option>' +
        '<option value="Cartão Pessoal">Cartão Pessoal</option>' +
        '<option value="Cartão Clara">Cartão Clara</option>' +
      '</select>' +
    '</div>' +

    '<div class="campo campo-condicional campo-categoria-despesa oculto">' +
      '<label>Onde ocorreu o gasto?</label>' +
      `<select name="despesa[${indice}][categoria]" class="select-bonito">` +
        '<option value="">Selecione...</option>' +
        '<option value="Hospedagem">Hospedagem</option>' +
        '<option value="Abastecimento">Abastecimento</option>' +
        '<option value="Pedágio">Pedágio</option>' +
        '<option value="Refeição">Refeição</option>' +
      '</select>' +
    '</div>' +

    '<div class="campo campo-condicional campo-comprovante-despesa oculto">' +
      '<label>Anexar Nota Fiscal (foto ou arquivo):</label>' +
      `<input type="file" name="despesa[${indice}][comprovante]" ` +
        'accept="image/*,.pdf">' +
    '</div>' +

    '<div class="campo">' +
      '<label>Valor Reembolso (R$):</label>' +
      `<input type="number" name="despesa[${indice}][reembolso]" ` +
        'placeholder="0,00" step="0.01" min="0" required>' +
    '</div>';

  container.appendChild(novoBloco);
  configurarEventosDespesa(novoBloco);
  observarReveals(novoBloco);
  inicializarDataPicker(novoBloco);
  novoBloco.scrollIntoView({ behavior: "smooth", block: "start" });
}


// ── Configuração de botões ───────────────────────────────────────

/**
 * Liga os botões de adicionar (trajeto, despesa, agência)
 * e o botão de remover agência da primeira linha.
 * O botão "salvar dia" é ligado pelo main.ts porque depende
 * de funções de outros módulos.
 */
export function configurarBotoesAdicionar(): void {
  const btnTrajeto = document.getElementById("btn-add-trajeto");
  if (btnTrajeto) btnTrajeto.addEventListener("click", adicionarBlocoTrajeto);

  const btnDespesa = document.getElementById("btn-add-despesa");
  if (btnDespesa) btnDespesa.addEventListener("click", adicionarBlocoDespesa);

  // Botão "+ Adicionar agência" da etapa Visita
  const containerAgencias = document.querySelector<HTMLDivElement>(
    ".container-agencias-dia"
  );
  const btnAddLinha = document.querySelector<HTMLButtonElement>(
    ".btn-add-agencia-linha"
  );

  if (btnAddLinha && containerAgencias) {
    btnAddLinha.addEventListener("click", () => {
      adicionarLinhaAgencia(containerAgencias);
    });
  }

  // Botão remover da primeira linha de agência
  const primeiroRemover = document.querySelector<HTMLButtonElement>(
    ".btn-remover-agencia"
  );
  if (primeiroRemover) {
    primeiroRemover.addEventListener("click", function (this: HTMLElement) {
      this.closest(".linha-agencia")?.remove();
    });
  }
}


/**
 * Liga os eventos do primeiro bloco de despesa que já existe no HTML.
 */
export function configurarDespesaInicial(): void {
  const primeiroBloco = document.querySelector<HTMLFieldSetElement>(".bloco-despesa");
  if (primeiroBloco) {
    configurarEventosDespesa(primeiroBloco);
  }
}


// ── Coleta de dados ──────────────────────────────────────────────

/**
 * Coleta trajetos da etapa Despesas.
 */
export function coletarTrajetos(): TrajetoDespesa[] {
  const trajetos: TrajetoDespesa[] = [];

  document
    .querySelectorAll<HTMLFieldSetElement>(".bloco-trajeto")
    .forEach((bloco) => {
      const data = bloco.querySelector<HTMLInputElement>('input[name*="[data]"]')?.value.trim() || "";
      const partida = bloco.querySelector<HTMLInputElement>('input[name*="[partida]"]')?.value.trim() || "";
      const destino = bloco.querySelector<HTMLInputElement>('input[name*="[destino]"]')?.value.trim() || "";
      const km = parseFloat(bloco.querySelector<HTMLInputElement>('input[name*="[km]"]')?.value || "0");
      const reembolsoKm = parseFloat(bloco.querySelector<HTMLInputElement>('input[name*="[reembolso_km]"]')?.value || "0");

      if (partida || destino || km) {
        trajetos.push({ data, partida, destino, km, reembolsoKm });
      }
    });

  return trajetos;
}


/**
 * Coleta despesas da etapa Despesas.
 */
export function coletarDespesas(): Despesa[] {
  const despesas: Despesa[] = [];

  document
    .querySelectorAll<HTMLFieldSetElement>(".bloco-despesa")
    .forEach((bloco) => {
      const data = bloco.querySelector<HTMLInputElement>('input[name*="[data]"]')?.value.trim() || "";
      const cartao = bloco.querySelector<HTMLSelectElement>('select[name*="[cartao]"]')?.value.trim() || "";
      const categoria = bloco.querySelector<HTMLSelectElement>('select[name*="[categoria]"]')?.value.trim() || "";
      const valor = parseFloat(bloco.querySelector<HTMLInputElement>('input[name*="[reembolso]"]')?.value || "0");
      const inputArq = bloco.querySelector<HTMLInputElement>('input[type="file"]');
      const nomeArquivo = inputArq?.files?.[0]?.name || "";

      if (data || cartao) {
        despesas.push({
          data,
          cidade: categoria, // categoria funciona como "onde" da despesa
          descricao: cartao,
          valor,
          nomeArquivo,
        });
      }
    });

  return despesas;
}


// ── Reset ────────────────────────────────────────────────────────

/**
 * Reseta os campos e remove blocos extras.
 */
export function limparFormulario(): void {
  // Limpa inputs e textareas das etapas
  document
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      ".etapa input:not([readonly]):not([type=hidden]), " +
      ".etapa textarea, .etapa select"
    )
    .forEach((campo) => {
      if (campo instanceof HTMLInputElement) {
        if (campo.type === "radio" || campo.type === "checkbox") {
          campo.checked = false;
        } else if (campo.type === "file") {
          campo.value = "";
        } else {
          campo.value = "";
        }
      } else {
        campo.value = "";
      }
    });

  // Remove blocos extras (mantém só o primeiro)
  ["container-trajetos", "container-despesas"].forEach((id) => {
    const container = document.getElementById(id);
    if (!container) return;
    while (container.children.length > 1) {
      container.removeChild(container.lastChild!);
    }
  });

  // Esconde campos condicionais
  document
    .querySelectorAll<HTMLElement>(".campo-condicional, .textarea-acao")
    .forEach((el) => el.classList.add("oculto"));

  // Limpa agências comerciais
  const containerAgencias = document.getElementById("container-agencias-comercial");
  if (containerAgencias) containerAgencias.innerHTML = "";

  // Limpa linhas extras de agência na etapa Visita
  const containerLinhas = document.querySelector<HTMLDivElement>(
    ".container-agencias-dia"
  );
  if (containerLinhas) {
    containerLinhas
      .querySelectorAll<HTMLDivElement>(".linha-agencia")
      .forEach((linha, idx) => {
        if (idx > 0) {
          linha.remove();
        } else {
          const input = linha.querySelector<HTMLInputElement>("input");
          if (input) input.value = "";
        }
      });
  }

  totalTrajetos = 1;
  totalDespesas = 1;
}