// ================================================================
// ESTRESSE — nível de estresse por setor (etapa Agências).
// Unifica o que antes eram 3 arquivos:
//   estresse-config.js → dados movidos para config/dados.ts
//   estresse-popup.js  → função abrirPopup (aqui)
//   estresse-setor.js  → geração de HTML + eventos (aqui)
//
// Fluxo: escolher nível → pop-up explicativo → marcar setores →
// (se exigido) descrever o ocorrido → "+ Adicionar registro".
// Cada agência pode acumular vários registros.
// ================================================================

import {
  niveisEstresse,
  setoresEstresse,
} from "../config/dados";
import type { RegistroEstresse } from "../types";
import { observarReveals } from "./scroll-reveal";


// ── Pop-up explicativo ───────────────────────────────────────────

/**
 * Abre um pop-up com a descrição do nível de estresse.
 * Só fecha pelo botão "Entendi"; o callback roda depois.
 */
function abrirPopup(nivel: string, aoFechar: () => void): void {
  const definicao = niveisEstresse.find((n) => n.nome === nivel);

  if (!definicao) {
    aoFechar();
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  overlay.innerHTML =
    '<div class="popup-caixa" role="dialog" aria-modal="true" aria-labelledby="popup-titulo-estresse">' +
      `<h3 id="popup-titulo-estresse" class="popup-titulo" data-nivel="${definicao.nome}">` +
        `Nível ${definicao.nome}` +
      '</h3>' +
      `<p class="popup-texto">${definicao.descricao}</p>` +
      '<button type="button" class="btn-fechar-popup">Entendi</button>' +
    '</div>';

  document.body.appendChild(overlay);
  document.body.classList.add("popup-aberto");

  overlay.querySelector(".btn-fechar-popup")!
    .addEventListener("click", () => {
      overlay.remove();
      document.body.classList.remove("popup-aberto");
      aoFechar();
    });
}


// ── Geração de HTML ──────────────────────────────────────────────

/**
 * Gera o HTML do componente de estresse por setor.
 * Chamado por agencia-analise.ts ao montar o bloco de termômetro.
 */
export function gerarHtmlEstresseSetor(indice: number): string {
  let html = '<div class="estresse-niveis">';

  niveisEstresse.forEach((nivel) => {
    html +=
      `<button type="button" class="btn-nivel-estresse" data-nivel="${nivel.nome}">` +
        nivel.nome +
      '</button>';
  });

  html += '</div>';

  // Painel de setores (aparece após escolher o nível)
  html += '<div class="estresse-painel-setores oculto">';
  html += '<p class="estresse-nivel-ativo">Nível selecionado: <strong class="estresse-nivel-ativo-texto"></strong></p>';
  html += '<div class="opcoes-checkbox estresse-setores-checkboxes">';

  setoresEstresse.forEach((setor) => {
    html +=
      '<label class="opcao-checkbox">' +
        `<input type="checkbox" class="checkbox-estresse-setor" value="${setor}">` +
        `<span>${setor}</span>` +
      '</label>';
  });

  html += '</div>';

  // Descrição (aparece se o nível exige)
  html +=
    '<div class="campo-condicional estresse-descricao-wrap oculto">' +
      '<textarea class="estresse-descricao-texto" rows="2" ' +
        'placeholder="Conte-nos mais sobre o que aconteceu e como foi resolvido."></textarea>' +
    '</div>';

  html += '<button type="button" class="btn-adicionar-registro-estresse">+ Adicionar novo registro de sentimento</button>';
  html += '</div>';

  // Lista de registros já adicionados + input hidden com JSON
  html += '<div class="estresse-registros-lista"></div>';
  html +=
    '<input type="hidden" class="estresse-registros-json" ' +
      `name="analise[${indice}][estresse_registros]" value="[]">`;

  return html;
}


// ── Registro em andamento ────────────────────────────────────────

/**
 * Lê a seleção que está visível no painel (nível + setores + descrição),
 * mesmo que o usuário ainda não tenha clicado em "+ Adicionar registro".
 * Usado na coleta de dados para não perder nada já preenchido na tela.
 */
export function obterRegistroEmAndamento(
  bloco: HTMLElement
): RegistroEstresse | null {
  const painel = bloco.querySelector(".estresse-painel-setores");
  if (!painel || painel.classList.contains("oculto")) return null;

  const nivel =
    bloco.querySelector(".estresse-nivel-ativo-texto")?.textContent?.trim() || "";
  if (!nivel) return null;

  const setores: string[] = [];
  bloco
    .querySelectorAll<HTMLInputElement>(".checkbox-estresse-setor:checked")
    .forEach((cb) => setores.push(cb.value));

  if (setores.length === 0) return null;

  const descricao =
    (bloco.querySelector(".estresse-descricao-texto") as HTMLTextAreaElement)
      ?.value.trim() || "";

  return { nivel, setores, descricao };
}


// ── Eventos ──────────────────────────────────────────────────────

/**
 * Liga todos os eventos interativos do componente de estresse
 * dentro de um bloco (fieldset) de análise.
 */
export function inicializarEstresseSetor(bloco: HTMLElement): void {
  const botoesNivel = bloco.querySelectorAll<HTMLButtonElement>(".btn-nivel-estresse");
  const painel = bloco.querySelector<HTMLDivElement>(".estresse-painel-setores");
  const nivelAtivoTexto = bloco.querySelector<HTMLElement>(".estresse-nivel-ativo-texto");
  const checkboxesSetor = bloco.querySelectorAll<HTMLInputElement>(".checkbox-estresse-setor");
  const descricaoWrap = bloco.querySelector<HTMLDivElement>(".estresse-descricao-wrap");
  const descricaoTexto = bloco.querySelector<HTMLTextAreaElement>(".estresse-descricao-texto");
  const btnAdicionar = bloco.querySelector<HTMLButtonElement>(".btn-adicionar-registro-estresse");
  const lista = bloco.querySelector<HTMLDivElement>(".estresse-registros-lista");
  const inputJson = bloco.querySelector<HTMLInputElement>(".estresse-registros-json");

  if (!painel || !inputJson || !lista || !descricaoWrap || !descricaoTexto || !nivelAtivoTexto || !btnAdicionar) return;

  let nivelSelecionado = "";

  // Helpers para ler/gravar o JSON dos registros
  function obterRegistros(): RegistroEstresse[] {
    try {
      return JSON.parse(inputJson!.value || "[]") as RegistroEstresse[];
    } catch {
      return [];
    }
  }

  function salvarRegistros(registros: RegistroEstresse[]): void {
    inputJson!.value = JSON.stringify(registros);
  }

  // Renderiza um card de registro na lista
  function renderizarCard(registro: RegistroEstresse, indiceRegistro: number): void {
    const card = document.createElement("div");
    card.className = "estresse-registro-card";
    card.innerHTML =
      '<div class="estresse-registro-cabecalho">' +
        `<span class="estresse-registro-nivel" data-nivel="${registro.nivel}">${registro.nivel}</span>` +
        '<button type="button" class="btn-remover-registro-estresse" aria-label="Remover registro">&times;</button>' +
      '</div>' +
      `<div class="estresse-registro-setores">${registro.setores.join(" · ")}</div>` +
      (registro.descricao
        ? `<p class="estresse-registro-descricao">${registro.descricao}</p>`
        : "");

    card.querySelector(".btn-remover-registro-estresse")!
      .addEventListener("click", () => {
        const registros = obterRegistros();
        registros.splice(indiceRegistro, 1);
        salvarRegistros(registros);
        renderizarLista();
      });

    lista!.appendChild(card);
    observarReveals(card);
  }

  function renderizarLista(): void {
    lista!.innerHTML = "";
    obterRegistros().forEach((registro, i) => renderizarCard(registro, i));
  }

  function resetarPainel(): void {
    painel!.classList.add("oculto");
    checkboxesSetor.forEach((cb) => { cb.checked = false; });
    descricaoWrap!.classList.add("oculto");
    descricaoTexto!.value = "";
    descricaoTexto!.required = false;
    nivelSelecionado = "";
    botoesNivel.forEach((b) => b.classList.remove("selecionado"));
  }

  // Clique nos botões de nível
  botoesNivel.forEach((botao) => {
    botao.addEventListener("click", () => {
      const nivel = botao.getAttribute("data-nivel") || "";

      abrirPopup(nivel, () => {
        nivelSelecionado = nivel;
        nivelAtivoTexto!.textContent = nivel;
        painel!.classList.remove("oculto");
        checkboxesSetor.forEach((cb) => { cb.checked = false; });

        // Marca visualmente qual nível foi clicado
        botoesNivel.forEach((b) => b.classList.remove("selecionado"));
        botao.classList.add("selecionado");

        const definicao = niveisEstresse.find((n) => n.nome === nivel);
        const exigeDescricao = definicao?.exigeDescricao ?? false;

        descricaoTexto!.value = "";
        if (exigeDescricao) {
          descricaoWrap!.classList.remove("oculto");
          descricaoTexto!.required = true;
        } else {
          descricaoWrap!.classList.add("oculto");
          descricaoTexto!.required = false;
        }

        painel!.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  });

  // Botão "+ Adicionar registro"
  btnAdicionar.addEventListener("click", () => {
    if (!nivelSelecionado) return;

    const setoresMarcados: string[] = [];
    checkboxesSetor.forEach((cb) => {
      if (cb.checked) setoresMarcados.push(cb.value);
    });

    if (setoresMarcados.length === 0) {
      alert("Selecione pelo menos um setor antes de adicionar o registro.");
      return;
    }

    const definicao = niveisEstresse.find((n) => n.nome === nivelSelecionado);
    const descricao = descricaoTexto!.value.trim();

    if (definicao?.exigeDescricao && !descricao) {
      alert("Preencha a descrição antes de adicionar o registro.");
      return;
    }

    const registros = obterRegistros();
    registros.push({
      nivel: nivelSelecionado,
      setores: setoresMarcados,
      descricao,
    });
    salvarRegistros(registros);
    renderizarLista();
    resetarPainel();
  });

  // Renderiza registros que já existam no hidden (ex: ao recarregar)
  renderizarLista();
}