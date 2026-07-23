// ================================================================
// FLUXO — navegação entre etapas, escolha de relatório e
// preenchimento automático do e-mail.
//
// A etapa 1 pergunta qual relatório preencher:
//   "visita"   → Visita → Agências → Resumo
//   "despesas" → Despesas → Resumo
//
// Os dois podem ser preenchidos no mesmo dia.
// ================================================================

import {
  FLUXOS,
  ROTULOS_ETAPA,
  ROTULOS_FLUXO,
  ORDEM_GERAL_ETAPAS,
  emailsExecutivos,
} from "../config/dados";
import type { NomeEtapa, NomeFluxo } from "../config/dados";
import { sincronizarAgenciasETermometro } from "./agencia-analise";


// ── Estado ───────────────────────────────────────────────────────

let fluxoAtivo: NomeFluxo | null = null;
let fluxosAdicionados: NomeFluxo[] = [];

// Callbacks registrados externamente (resumo, salvar dia)
let callbackResumo: (() => void) | null = null;


/**
 * Registra a função que monta o resumo.
 * Chamada pelo main.ts para evitar dependência circular.
 */
export function registrarCallbackResumo(fn: () => void): void {
  callbackResumo = fn;
}

/**
 * Retorna o fluxo sendo navegado agora.
 */
export function obterFluxoAtivo(): NomeFluxo | null {
  return fluxoAtivo;
}

/**
 * Retorna os fluxos já adicionados neste dia.
 */
export function obterFluxosAdicionados(): NomeFluxo[] {
  return fluxosAdicionados;
}


// ── Barra de progresso ───────────────────────────────────────────

/**
 * Lista de etapas a exibir: identificação e resumo sempre,
 * mais as etapas de cada fluxo já adicionado.
 */
function obterEtapasCombinadas(): NomeEtapa[] {
  const validas = new Set<NomeEtapa>(["identificacao", "resumo"]);

  fluxosAdicionados.forEach((nome) => {
    FLUXOS[nome].forEach((etapa) => validas.add(etapa));
  });

  return ORDEM_GERAL_ETAPAS.filter((etapa) => validas.has(etapa));
}

/**
 * Monta a barra de progresso com as etapas combinadas.
 */
function renderizarProgresso(): void {
  const nav = document.querySelector(".progresso");
  const lista = document.getElementById("progresso-lista");
  if (!nav || !lista || fluxosAdicionados.length === 0) return;

  lista.innerHTML = "";

  obterEtapasCombinadas().forEach((nomeEtapa) => {
    const li = document.createElement("li");
    li.className = "progresso-item";
    li.setAttribute("data-etapa", nomeEtapa);
    li.innerHTML =
      '<span class="progresso-numero">●</span>' +
      `<span class="progresso-texto">${ROTULOS_ETAPA[nomeEtapa]}</span>`;
    lista.appendChild(li);
  });

  (nav as HTMLElement).classList.remove("oculto");
}

/**
 * Marca o item atual como "ativo" e os anteriores como "concluido".
 */
function atualizarEstadoProgresso(nomeEtapaAtual: NomeEtapa): void {
  if (fluxosAdicionados.length === 0) return;

  const ordem = obterEtapasCombinadas();
  const indiceAtual = ordem.indexOf(nomeEtapaAtual);

  document
    .querySelectorAll<HTMLLIElement>(".progresso-item")
    .forEach((item) => {
      const nomeItem = item.getAttribute("data-etapa") as NomeEtapa;
      const indiceItem = ordem.indexOf(nomeItem);
      item.classList.remove("ativo", "concluido");

      if (indiceItem === indiceAtual) {
        item.classList.add("ativo");
      } else if (indiceItem !== -1 && indiceItem < indiceAtual) {
        item.classList.add("concluido");
      }
    });
}


// ── Botão "trocar fluxo" no resumo ───────────────────────────────

/**
 * No resumo, mostra um botão para adicionar o relatório
 * que ainda não foi preenchido neste dia.
 */
function renderizarBotaoTrocarFluxo(): void {
  const container = document.getElementById("resumo-trocar-fluxo");
  if (!container) return;

  const fluxosFaltando = (Object.keys(FLUXOS) as NomeFluxo[]).filter(
    (nome) => fluxosAdicionados.indexOf(nome) === -1
  );

  if (fluxosFaltando.length === 0) {
    container.innerHTML =
      '<p class="resumo-fluxos-completos">✅ Os dois relatórios já estão preenchidos neste dia.</p>';
    return;
  }

  let html =
    '<p class="resumo-trocar-fluxo-texto">Precisa preencher o outro relatório também?</p>';

  fluxosFaltando.forEach((nome) => {
    html +=
      `<button type="button" class="btn-adicionar-fluxo" data-fluxo="${nome}">` +
        `+ Preencher também o ${ROTULOS_FLUXO[nome]}` +
      '</button>';
  });

  container.innerHTML = html;

  container
    .querySelectorAll<HTMLButtonElement>(".btn-adicionar-fluxo")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        const fluxo = botao.getAttribute("data-fluxo") as NomeFluxo;
        adicionarFluxo(fluxo);
      });
    });
}


// ── Navegação ────────────────────────────────────────────────────

/**
 * Esconde todas as etapas, mostra só a de destino
 * e atualiza a barra de progresso.
 */
export function irParaEtapa(nomeEtapa: NomeEtapa): void {
  document.querySelectorAll(".etapa").forEach((etapa) => {
    etapa.classList.add("oculto");
  });

  const etapaDestino = document.querySelector<HTMLElement>(
    `.etapa[data-etapa="${nomeEtapa}"]`
  );
  if (etapaDestino) {
    etapaDestino.classList.remove("oculto");
  }

  atualizarEstadoProgresso(nomeEtapa);
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Sincroniza agências ao entrar na etapa Agências
  if (nomeEtapa === "agencias") {
    sincronizarAgenciasETermometro();
  }

  // Monta o resumo ao chegar nele
  if (nomeEtapa === "resumo") {
    renderizarBotaoTrocarFluxo();
    callbackResumo?.();
  }
}


/**
 * Escolhido na etapa 1 (primeira vez no dia).
 */
function escolherFluxo(nome: NomeFluxo): void {
  if (!FLUXOS[nome]) return;
  fluxosAdicionados = [nome];
  fluxoAtivo = nome;
  renderizarProgresso();
  irParaEtapa(FLUXOS[nome][1]);
}

/**
 * Escolhido no Resumo: adiciona o relatório que faltava.
 */
function adicionarFluxo(nome: NomeFluxo): void {
  if (!FLUXOS[nome] || fluxosAdicionados.indexOf(nome) !== -1) return;
  fluxosAdicionados.push(nome);
  fluxoAtivo = nome;
  renderizarProgresso();
  irParaEtapa(FLUXOS[nome][1]);
}


// ── E-mail automático ────────────────────────────────────────────

/**
 * Quando o executivo escolhe o nome, preenche o e-mail.
 */
export function configurarPreenchimentoEmail(): void {
  const selectNome = document.getElementById("nome_executivo") as HTMLSelectElement | null;
  const inputEmail = document.getElementById("email_executivo") as HTMLInputElement | null;

  if (!selectNome || !inputEmail) return;

  selectNome.addEventListener("change", () => {
    const nomeSelecionado = selectNome.value;
    const email = emailsExecutivos[nomeSelecionado] || "";

    inputEmail.value = email;

    if (!email && nomeSelecionado) {
      inputEmail.focus();
    }
  });
}


// ── Configuração dos botões ──────────────────────────────────────

/**
 * Liga os botões de escolha de fluxo (etapa 1).
 */
export function configurarBotoesFluxo(): void {
  document
    .querySelectorAll<HTMLButtonElement>(".btn-fluxo")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        const fluxo = botao.getAttribute("data-fluxo") as NomeFluxo;
        escolherFluxo(fluxo);
      });
    });
}

/**
 * Liga os botões Próximo, Voltar e Finalizar.
 */
export function configurarBotoesNavegacao(): void {
  document
    .querySelectorAll<HTMLButtonElement>(".btn-proximo")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        const destino = botao.getAttribute("data-proximo") as NomeEtapa;
        irParaEtapa(destino);
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>(".btn-voltar")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        const destino = botao.getAttribute("data-voltar") as NomeEtapa;
        irParaEtapa(destino);
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>(".btn-finalizar")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        const destino = botao.getAttribute("data-finalizar") as NomeEtapa;
        irParaEtapa(destino);
      });
    });
}


/**
 * Reseta o estado do fluxo para um novo dia.
 */
export function resetarFluxo(): void {
  fluxoAtivo = null;
  fluxosAdicionados = [];
}