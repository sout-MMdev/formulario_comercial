// ================================================================
// AGÊNCIAS — carrega a lista de agências do JSON e monta
// o autocomplete nos campos .input-agencia.
// ================================================================

import { removerAcentos } from "../utils/formatadores";


// Lista carregada uma única vez quando a página abre.
let todasAgencias: string[] = [];


/**
 * Busca o arquivo agencias.json e guarda na memória.
 */
export async function buscarAgencias(): Promise<void> {
  try {
    const resposta = await fetch("agencias.json");

    if (!resposta.ok) {
      throw new Error("Arquivo agencias.json não encontrado.");
    }

    todasAgencias = (await resposta.json()) as string[];
    console.log("Agências carregadas:", todasAgencias.length, "registros");
  } catch (erro) {
    console.warn("Não foi possível carregar as agências:", erro);
    console.warn("O campo funcionará como texto livre.");
  }
}


/**
 * Retorna até 8 agências que contenham o texto digitado.
 * A busca ignora maiúsculas, minúsculas e acentos.
 */
function filtrarAgencias(textoBusca: string): string[] {
  const buscaSemAcento = removerAcentos(textoBusca);

  return todasAgencias
    .filter((agencia) => removerAcentos(agencia).includes(buscaSemAcento))
    .slice(0, 8);
}


/**
 * Esconde a lista suspensa e limpa o conteúdo.
 */
function fecharLista(listaUl: HTMLUListElement): void {
  listaUl.classList.add("oculto");
  listaUl.innerHTML = "";
}


/**
 * Preenche o <ul> com as agências filtradas.
 */
function mostrarLista(
  inputAgencia: HTMLInputElement,
  listaUl: HTMLUListElement
): void {
  const textoBusca = inputAgencia.value.trim();

  if (textoBusca.length < 2) {
    fecharLista(listaUl);
    return;
  }


  // Filtra e mostra as agências

  const agenciasFiltradas = filtrarAgencias(textoBusca);

  if (agenciasFiltradas.length === 0) {
    fecharLista(listaUl);
    return;
  }

  listaUl.innerHTML = "";

  agenciasFiltradas.forEach((agencia) => {
    const item = document.createElement("li");
    item.classList.add("lista-cidades-item");
    item.textContent = agencia;

    // mousedown antes do blur para não fechar antes de selecionar
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      inputAgencia.value = agencia;
      fecharLista(listaUl);
      inputAgencia.blur();
    });

    listaUl.appendChild(item);
  });

  listaUl.classList.remove("oculto");
}


/**
 * Liga os eventos de autocomplete em um input de agência.
 * Cria o <ul> da lista suspensa dinamicamente.
 * Chamada pelo main.ts e pelos módulos que criam blocos novos.
 */
export function configurarAutocompleteAgencia(
  inputAgencia: HTMLInputElement
): void {
  // Cria o <ul> e insere logo depois do input
  const listaUl = document.createElement("ul");
  listaUl.classList.add("lista-cidades", "oculto");
  inputAgencia.insertAdjacentElement("afterend", listaUl);

  // Filtra a cada letra digitada
  inputAgencia.addEventListener("input", () => {
    mostrarLista(inputAgencia, listaUl);
  });

  // Fecha ao sair do campo (150ms para o mousedown executar)
  inputAgencia.addEventListener("blur", () => {
    setTimeout(() => fecharLista(listaUl), 150);
  });

  // Reabre se o campo já tiver texto
  inputAgencia.addEventListener("focus", () => {
    if (inputAgencia.value.length >= 2) {
      mostrarLista(inputAgencia, listaUl);
    }
  });
}


/**
 * Liga o autocomplete em todos os .input-agencia da página.
 */
export function configurarTodosAutocompletesAgencia(): void {
  document
    .querySelectorAll<HTMLInputElement>(".input-agencia")
    .forEach((input) => {
      configurarAutocompleteAgencia(input);
    });
}