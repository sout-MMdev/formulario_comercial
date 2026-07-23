// ================================================================
// MULTISELECT — botão que abre uma lista de checkboxes suspensa.
// Usado em "Produto que a agência mais vende" e
// "Atendente de Preferência" (etapa Agências).
// ================================================================

import type { MultiSelectOpcoes } from "../types";


// Controle para ligar o clique-fora uma única vez.
let cliqueForaLigado = false;


/**
 * Gera o HTML do componente multiselect.
 * Retorna um botão + lista suspensa com checkboxes.
 */
export function gerarHtmlMultiSelect(opcoes: MultiSelectOpcoes): string {
  const { name, opcoes: itens = [], placeholder = "Selecione..." } = opcoes;

  let html =
    '<div class="multiselect">' +
      '<button type="button" class="multiselect-botao">' +
        `<span class="multiselect-botao-texto" data-placeholder="${placeholder}">` +
          placeholder +
        '</span>' +
        '<span class="multiselect-seta">▾</span>' +
      '</button>' +
      '<div class="multiselect-lista oculto">';

  itens.forEach((item) => {
    html +=
      '<label class="opcao-checkbox">' +
        `<input type="checkbox" name="${name}[]" value="${item}">` +
        `<span>${item}</span>` +
      '</label>';
  });

  html += '</div></div>';
  return html;
}


/**
 * Liga o comportamento (abrir/fechar, atualizar texto do botão)
 * de cada .multiselect ainda não ligado dentro do escopo.
 * Chamar de novo após inserir blocos novos no DOM.
 */
export function inicializarMultiSelects(
  escopo?: HTMLElement | Document
): void {
  const raiz = escopo || document;

  raiz.querySelectorAll<HTMLDivElement>(".multiselect").forEach((campo) => {
    // Não liga duas vezes no mesmo elemento
    if (campo.dataset.multiselectLigado === "true") return;
    campo.dataset.multiselectLigado = "true";

    const botao = campo.querySelector<HTMLButtonElement>(".multiselect-botao");
    const botaoTexto = campo.querySelector<HTMLSpanElement>(".multiselect-botao-texto");
    const lista = campo.querySelector<HTMLDivElement>(".multiselect-lista");

    if (!botao || !botaoTexto || !lista) return;

    const placeholder = botaoTexto.dataset.placeholder || botaoTexto.textContent || "";

    // Atualiza o texto do botão com os itens marcados
    function atualizarTexto(): void {
      const marcados = Array.from(
        lista!.querySelectorAll<HTMLInputElement>("input:checked")
      ).map((cb) => cb.value);

      botaoTexto!.textContent =
        marcados.length > 0 ? marcados.join(", ") : placeholder;
    }

    // Abre/fecha a lista ao clicar no botão
    botao.addEventListener("click", (evento) => {
      evento.stopPropagation();

      const estaAberta = !lista.classList.contains("oculto");

      // Fecha todas as outras listas abertas
      document.querySelectorAll(".multiselect-lista").forEach((outra) => {
        outra.classList.add("oculto");
      });

      if (!estaAberta) {
        lista.classList.remove("oculto");
      }
    });

    // Impede que clicar dentro da lista feche ela
    lista.addEventListener("click", (evento) => {
      evento.stopPropagation();
    });

    // Atualiza o texto a cada checkbox marcado/desmarcado
    lista.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.addEventListener("change", atualizarTexto);
      });

    atualizarTexto();
  });

  // Liga o clique-fora uma única vez (fecha qualquer lista aberta)
  if (!cliqueForaLigado) {
    cliqueForaLigado = true;

    document.addEventListener("click", () => {
      document.querySelectorAll(".multiselect-lista").forEach((lista) => {
        lista.classList.add("oculto");
      });
    });
  }
}