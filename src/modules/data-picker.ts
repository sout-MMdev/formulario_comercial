// ================================================================
// DATA PICKER — seletor de data customizado com pop-up.
// Cada campo de data guarda dois inputs:
//   - hidden → valor canônico "YYYY-MM-DD" (lido pelas coletas)
//   - texto  → exibe "dd/mm/aaaa" para o usuário (somente leitura)
// ================================================================

import {
  NOMES_MESES,
  DATA_ANOS_PARA_TRAS,
  DATA_ANOS_PARA_FRENTE,
} from "../config/dados";
import type { CampoDataOpcoes } from "../types";


// ── Tipos internos ───────────────────────────────────────────────

interface ItemColuna {
  valor: number;
  texto: string;
}


// ── Geração de HTML ──────────────────────────────────────────────

/**
 * Gera o HTML de um campo de data customizado.
 * Retorna um input hidden + input texto + botão de calendário.
 */
export function gerarHtmlCampoData(opcoes: CampoDataOpcoes): string {
  const { name, id, required } = opcoes;

  const idHidden  = id ? ` id="${id}_iso"` : "";
  const idVisivel = id ? ` id="${id}"` : "";
  const req       = required ? " required" : "";

  return (
    '<div class="data-campo">' +
      `<input type="hidden" name="${name}"${idHidden}>` +
      `<input type="text" class="data-campo-texto"${idVisivel}` +
        ` placeholder="dd/mm/aaaa" readonly${req}>` +
      '<button type="button" class="btn-abrir-data" aria-label="Abrir calendário">📅</button>' +
    '</div>'
  );
}


// ── Helpers ──────────────────────────────────────────────────────

/** Quantos dias tem um mês (trata fevereiro e meses de 30 dias). */
function diasNoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

/** Monta os itens de uma coluna e liga o evento de seleção. */
function montarColuna(
  listaEl: HTMLUListElement,
  itens: ItemColuna[],
  valorAtual: number,
  aoSelecionar: (valor: number) => void
): void {
  listaEl.innerHTML = "";

  itens.forEach((item) => {
    const li = document.createElement("li");
    li.className =
      "data-coluna-item" + (item.valor === valorAtual ? " selecionado" : "");
    li.textContent = item.texto;

    li.addEventListener("click", () => {
      listaEl
        .querySelectorAll(".data-coluna-item")
        .forEach((el) => el.classList.remove("selecionado"));
      li.classList.add("selecionado");
      aoSelecionar(item.valor);
    });

    listaEl.appendChild(li);
  });
}


// ── Pop-up ───────────────────────────────────────────────────────

/**
 * Abre o pop-up com as 3 colunas e grava o resultado
 * nos inputs quando o usuário confirma.
 */
function abrirSeletorData(
  inputHidden: HTMLInputElement,
  inputTexto: HTMLInputElement
): void {
  const hoje = new Date();
  let dia = hoje.getDate();
  let mes = hoje.getMonth() + 1;
  let ano = hoje.getFullYear();

  // Se já tem valor, usa como ponto de partida
  if (inputHidden.value) {
    const partes = inputHidden.value.split("-");
    ano = parseInt(partes[0], 10);
    mes = parseInt(partes[1], 10);
    dia = parseInt(partes[2], 10);
  }

  const anoInicio = hoje.getFullYear() - DATA_ANOS_PARA_TRAS;
  const anoFim    = hoje.getFullYear() + DATA_ANOS_PARA_FRENTE;

  // Cria o overlay
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  overlay.innerHTML =
    '<div class="popup-caixa popup-caixa-data" role="dialog" aria-modal="true">' +
      '<h3 class="popup-titulo">Selecione a data</h3>' +
      '<div class="data-colunas">' +
        '<div class="data-coluna">' +
          '<div class="data-coluna-rotulo">Dia</div>' +
          '<ul class="data-coluna-lista" data-tipo="dia"></ul>' +
        '</div>' +
        '<div class="data-coluna">' +
          '<div class="data-coluna-rotulo">Mês</div>' +
          '<ul class="data-coluna-lista" data-tipo="mes"></ul>' +
        '</div>' +
        '<div class="data-coluna">' +
          '<div class="data-coluna-rotulo">Ano</div>' +
          '<ul class="data-coluna-lista" data-tipo="ano"></ul>' +
        '</div>' +
      '</div>' +
      '<div class="data-popup-acoes">' +
        '<button type="button" class="btn-cancelar-data">Cancelar</button>' +
        '<button type="button" class="btn-confirmar-data">Confirmar</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  document.body.classList.add("popup-aberto");

  const listaDiaEl = overlay.querySelector('[data-tipo="dia"]') as HTMLUListElement;
  const listaMesEl = overlay.querySelector('[data-tipo="mes"]') as HTMLUListElement;
  const listaAnoEl = overlay.querySelector('[data-tipo="ano"]') as HTMLUListElement;

  // Monta a coluna de dias (recalculada ao trocar mês ou ano)
  function montarDias(): void {
    const totalDias = diasNoMes(mes, ano);
    if (dia > totalDias) dia = totalDias;

    const itens: ItemColuna[] = [];
    for (let d = 1; d <= totalDias; d++) {
      itens.push({ valor: d, texto: String(d).padStart(2, "0") });
    }
    montarColuna(listaDiaEl, itens, dia, (valor) => { dia = valor; });
  }

  // Monta coluna de meses
  const itensMes: ItemColuna[] = NOMES_MESES.map((nome, i) => ({
    valor: i + 1,
    texto: nome,
  }));

  montarColuna(listaMesEl, itensMes, mes, (valor) => {
    mes = valor;
    montarDias();
    const sel = listaDiaEl.querySelector(".selecionado");
    if (sel) sel.scrollIntoView({ block: "center" });
  });

  // Monta coluna de anos (mais recente primeiro)
  const itensAno: ItemColuna[] = [];
  for (let a = anoFim; a >= anoInicio; a--) {
    itensAno.push({ valor: a, texto: String(a) });
  }

  montarColuna(listaAnoEl, itensAno, ano, (valor) => {
    ano = valor;
    montarDias();
    const sel = listaDiaEl.querySelector(".selecionado");
    if (sel) sel.scrollIntoView({ block: "center" });
  });

  montarDias();

  // Centraliza os itens selecionados na abertura
  requestAnimationFrame(() => {
    [listaDiaEl, listaMesEl, listaAnoEl].forEach((listaEl) => {
      const sel = listaEl.querySelector(".selecionado");
      if (sel) sel.scrollIntoView({ block: "center" });
    });
  });

  // Fechar
  function fechar(): void {
    overlay.remove();
    document.body.classList.remove("popup-aberto");
  }

  overlay.querySelector(".btn-cancelar-data")!
    .addEventListener("click", fechar);

  overlay.addEventListener("click", (evento) => {
    if (evento.target === overlay) fechar();
  });

  // Confirmar
  overlay.querySelector(".btn-confirmar-data")!
    .addEventListener("click", () => {
      const mesTexto = String(mes).padStart(2, "0");
      const diaTexto = String(dia).padStart(2, "0");
      inputHidden.value = `${ano}-${mesTexto}-${diaTexto}`;
      inputTexto.value  = `${diaTexto}/${mesTexto}/${ano}`;
      fechar();
    });
}


// ── Inicialização ────────────────────────────────────────────────

/**
 * Liga o clique (texto e botão) de cada .data-campo
 * ainda não ligado dentro do escopo.
 * Chamar de novo após inserir blocos novos no DOM.
 */
export function inicializarDataPicker(escopo?: HTMLElement | Document): void {
  const raiz = escopo || document;

  raiz.querySelectorAll<HTMLDivElement>(".data-campo").forEach((campo) => {
    if (campo.dataset.dataPickerLigado === "true") return;
    campo.dataset.dataPickerLigado = "true";

    const inputHidden = campo.querySelector<HTMLInputElement>('input[type="hidden"]');
    const inputTexto  = campo.querySelector<HTMLInputElement>(".data-campo-texto");
    const botao       = campo.querySelector<HTMLButtonElement>(".btn-abrir-data");

    if (!inputHidden || !inputTexto) return;

    function abrir(): void {
      abrirSeletorData(inputHidden!, inputTexto!);
    }

    inputTexto.addEventListener("click", abrir);
    botao?.addEventListener("click", abrir);
  });
}