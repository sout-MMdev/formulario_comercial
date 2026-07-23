// ================================================================
// CIDADES — autocomplete em duas fases:
//   Fase 1: usuário digita → busca cidade na lista do IBGE.
//   Fase 2: cidade escolhida → busca rua/bairro no ViaCEP.
// Absorve o que antes eram dois arquivos (cidades.js + ruas.js).
// ================================================================

import { removerAcentos } from "../utils/formatadores";
import {
  RUAS_TAMANHO_MINIMO,
  RUAS_DEBOUNCE_MS,
} from "../config/dados";
import type { Cidade, Rua } from "../types";


// Lista carregada uma única vez via API do IBGE.
let todasCidades: Cidade[] = [];


// ── API do IBGE ──────────────────────────────────────────────────

/**
 * Busca todos os municípios do Brasil na API do IBGE.
 * Usa a rota ?view=nivelado que retorna campos planos.
 */
export async function buscarCidadesIBGE(): Promise<void> {
  try {
    const resposta = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome"
    );

    const dados = (await resposta.json()) as Record<string, string>[];

    todasCidades = dados.map((cidade) => ({
      nome:   cidade["municipio-nome"],
      estado: cidade["UF-sigla"],
      label:  cidade["municipio-nome"] + " - " + cidade["UF-sigla"],
    }));

    console.log("Cidades carregadas:", todasCidades.length, "municípios");
  } catch (erro) {
    console.warn("Não foi possível carregar as cidades do IBGE.", erro);
    console.warn("Os campos de cidade funcionarão como texto livre.");
  }
}


/**
 * Retorna até 8 cidades que contenham o texto digitado.
 */
function filtrarCidades(textoBusca: string): Cidade[] {
  const buscaSemAcento = removerAcentos(textoBusca);

  return todasCidades
    .filter((cidade) => removerAcentos(cidade.label).includes(buscaSemAcento))
    .slice(0, 8);
}


// ── API do ViaCEP ────────────────────────────────────────────────

/**
 * Busca ruas/bairros de uma cidade no ViaCEP.
 * Retorna até 8 resultados formatados.
 */
async function buscarRuasViaCEP(
  uf: string,
  cidade: string,
  textoBusca: string
): Promise<Rua[]> {
  const busca = textoBusca.trim();
  if (!uf || !cidade || busca.length < RUAS_TAMANHO_MINIMO) return [];

  try {
    const url =
      "https://viacep.com.br/ws/" +
      encodeURIComponent(uf) + "/" +
      encodeURIComponent(cidade) + "/" +
      encodeURIComponent(busca) + "/json/";

    const resposta = await fetch(url);
    const dados = await resposta.json();

    // ViaCEP responde { erro: true } quando não encontra nada.
    if (!Array.isArray(dados)) return [];

    return dados.slice(0, 8).map((item: Record<string, string>) => ({
      rua:    item.logradouro,
      bairro: item.bairro,
      cep:    item.cep,
      label:  item.logradouro + (item.bairro ? " - " + item.bairro : ""),
    }));
  } catch (erro) {
    console.warn("Não foi possível buscar ruas/bairros no ViaCEP.", erro);
    return [];
  }
}


// ── Lista suspensa ───────────────────────────────────────────────

function fecharLista(listaUl: HTMLUListElement): void {
  listaUl.classList.add("oculto");
  listaUl.innerHTML = "";
}


// Interface estendida para guardar dados no dataset do input.
// O TypeScript não conhece propriedades custom do dataset,
// então usamos um cast controlado quando necessário.
interface InputCidadeDataset {
  cidadeNome?: string;
  cidadeUf?: string;
  cidadeLabel?: string;
  fase?: string;
  _timeoutBuscaRua?: ReturnType<typeof setTimeout>;
}

function getDataset(input: HTMLInputElement): InputCidadeDataset {
  return input.dataset as unknown as InputCidadeDataset;
}


/**
 * Fase 1: mostra cidades filtradas. Ao escolher uma,
 * guarda cidade/UF no dataset e prepara para fase 2.
 */
function mostrarListaCidades(
  inputCidade: HTMLInputElement,
  listaUl: HTMLUListElement,
  textoBusca: string
): void {
  if (textoBusca.length < 2) {
    fecharLista(listaUl);
    return;
  }

  const cidadesFiltradas = filtrarCidades(textoBusca);

  if (cidadesFiltradas.length === 0) {
    fecharLista(listaUl);
    return;
  }

  listaUl.innerHTML = "";

  cidadesFiltradas.forEach((cidade) => {
    const item = document.createElement("li");
    item.classList.add("lista-cidades-item");
    item.textContent = cidade.label;

    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const ds = getDataset(inputCidade);
      ds.cidadeNome  = cidade.nome;
      ds.cidadeUf    = cidade.estado;
      ds.cidadeLabel = cidade.label;
      ds.fase        = "rua";
      inputCidade.value = cidade.label + ", ";
      fecharLista(listaUl);
      inputCidade.focus();
    });

    listaUl.appendChild(item);
  });

  listaUl.classList.remove("oculto");
}


/**
 * Fase 2: busca ruas/bairros na cidade já escolhida.
 */
async function mostrarListaRuas(
  inputCidade: HTMLInputElement,
  listaUl: HTMLUListElement,
  textoBuscaRua: string
): Promise<void> {
  if (textoBuscaRua.trim().length < RUAS_TAMANHO_MINIMO) {
    fecharLista(listaUl);
    return;
  }

  const ds = getDataset(inputCidade);
  const ruas = await buscarRuasViaCEP(
    ds.cidadeUf || "",
    ds.cidadeNome || "",
    textoBuscaRua
  );

  if (ds.fase !== "rua") return;

  if (ruas.length === 0) {
    fecharLista(listaUl);
    return;
  }

  listaUl.innerHTML = "";

  ruas.forEach((rua) => {
    const item = document.createElement("li");
    item.classList.add("lista-cidades-item");
    item.textContent = rua.label;

    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      inputCidade.value = rua.label + ", " + (ds.cidadeLabel || "");
      fecharLista(listaUl);
      inputCidade.blur();
    });

    listaUl.appendChild(item);
  });

  listaUl.classList.remove("oculto");
}


/**
 * Decide se busca cidade (fase 1) ou rua (fase 2).
 */
function mostrarListaSuspensa(
  inputCidade: HTMLInputElement,
  listaUl: HTMLUListElement
): void {
  const valor = inputCidade.value;
  const ds = getDataset(inputCidade);
  const prefixoCidade = ds.cidadeLabel ? ds.cidadeLabel + ", " : null;

  // Fase 2: já tem cidade, busca rua com debounce
  if (prefixoCidade && valor.startsWith(prefixoCidade)) {
    const textoBuscaRua = valor.slice(prefixoCidade.length);

    if (ds._timeoutBuscaRua) {
      clearTimeout(ds._timeoutBuscaRua);
    }

    ds._timeoutBuscaRua = setTimeout(() => {
      mostrarListaRuas(inputCidade, listaUl, textoBuscaRua);
    }, RUAS_DEBOUNCE_MS);
    return;
  }

  // Fase 1: busca cidade
  delete ds.cidadeNome;
  delete ds.cidadeUf;
  delete ds.cidadeLabel;
  ds.fase = "cidade";
  mostrarListaCidades(inputCidade, listaUl, valor.trim());
}


// ── Configuração ─────────────────────────────────────────────────

/**
 * Liga os eventos de autocomplete em um input de cidade.
 */
export function configurarAutocompleteCidade(
  inputCidade: HTMLInputElement
): void {
  const listaUl = inputCidade.nextElementSibling as HTMLUListElement | null;

  if (!listaUl || !listaUl.classList.contains("lista-cidades")) return;

  inputCidade.addEventListener("input", () => {
    mostrarListaSuspensa(inputCidade, listaUl);
  });

  inputCidade.addEventListener("blur", () => {
    setTimeout(() => fecharLista(listaUl), 150);
  });

  inputCidade.addEventListener("focus", () => {
    if (inputCidade.value.length >= 2) {
      mostrarListaSuspensa(inputCidade, listaUl);
    }
  });
}


/**
 * Liga o autocomplete em todos os .input-cidade da página.
 */
export function configurarTodosAutocompletes(): void {
  document
    .querySelectorAll<HTMLInputElement>(".input-cidade")
    .forEach((inputCidade) => {
      configurarAutocompleteCidade(inputCidade);
    });
}