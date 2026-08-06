// ================================================================
// CONFIG — APLICAÇÃO
// Constantes de comportamento: nomes de meses, limites de busca,
// chaves de armazenamento e endereços das APIs externas.
// ================================================================

export const NOME_APP = "Relatório Comercial";
export const NOME_EMPRESA = "Cativa Operadora";

/** Crédito exibido no rodapé. */
export const DESENVOLVEDOR = "Maxuel Nogueira";

/** Caminho do logotipo dentro de public/. */
export const CAMINHO_LOGO = "/assets/img/Logo Cativa_RGB_Logo Azul_Horizontal.png";

// ── Seletor de data ──────────────────────────────────────────────

export const NOMES_MESES: string[] = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const NOMES_MESES_CURTOS: string[] = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const DIAS_SEMANA_CURTOS: string[] = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

/** Quantos anos o seletor de data oferece para trás e para frente. */
export const DATA_ANOS_PARA_TRAS = 100;
export const DATA_ANOS_PARA_FRENTE = 5;

// ── Autocomplete ─────────────────────────────────────────────────

/** Mínimo de letras antes de começar a filtrar. */
export const BUSCA_TAMANHO_MINIMO = 2;

/** Máximo de sugestões exibidas na lista suspensa. */
export const BUSCA_MAX_RESULTADOS = 8;

/** Regras específicas da busca de ruas (ViaCEP é mais lento). */
export const RUAS_TAMANHO_MINIMO = 3;
export const RUAS_DEBOUNCE_MS = 400;

// ── APIs externas ────────────────────────────────────────────────

export const URL_IBGE_MUNICIPIOS =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome";

export const URL_VIACEP = "https://viacep.com.br/ws";

/** Base de agências servida por public/agencias.json. */
export const URL_AGENCIAS = "/agencias.json";

/** Tempo máximo de espera de cada API antes de liberar a tela. */
export const TIMEOUT_AGENCIAS_MS = 10000;
export const TIMEOUT_CIDADES_MS = 12000;

// ── Tela de abertura ─────────────────────────────────────────────

/**
 * Tempo MÍNIMO que a splash fica em cena.
 * Em rede boa as APIs respondem em menos de um segundo, e a tela
 * piscava. Este piso dá tempo de ler a marca e ver a barra encher.
 * Não é um atraso somado: se o carregamento demorar mais que isso,
 * a splash simplesmente espera o carregamento.
 */
export const SPLASH_DURACAO_MINIMA_MS = 4000;

// ── Armazenamento ────────────────────────────────────────────────

/** Chave do localStorage. Mantida igual à v1 para não perder dados. */
export const CHAVE_STORAGE = "cativa_dias_salvos";
