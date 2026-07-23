// ================================================================
// DADOS FIXOS — tudo que é configuração, lista, constante ou
// valor de referência do sistema vive aqui. Quando precisar
// adicionar um atendente, mudar uma tarifa ou incluir um setor,
// é só mexer neste arquivo.
// ================================================================

// ── Executivos ───────────────────────────────────────────────────
// Mapa nome → e-mail. Usado na etapa 1 para preencher
// o campo de e-mail automaticamente ao selecionar o nome.

export const emailsExecutivos: Record<string, string> = {
  "LUCAS MOREIRA":             "parana@empresa.exemplo",
  "ANA CARVALHO":     "riodejaneiro@empresa.exemplo",
  "RAFAEL TEIXEIRA": "pernambuco@empresa.exemplo",
  "BEATRIZ ARAUJO":                "riodejaneiro02@empresa.exemplo",
  "THIAGO BARBOSA":     "baixadasantista@empresa.exemplo",
  "LARISSA CARDOSO":              "norte@empresa.exemplo",
  "MATEUS PINTO":                   "bahiasergipe@empresa.exemplo",
  "PATRICIA GOMES":      "ribeiraoetriangulo@empresa.exemplo",
  "VINICIUS CORREIA":                  "parana02@empresa.exemplo",
  "ALINE FREITAS":     "goias@empresa.exemplo",
  "EXECUTIVO INTERNO CATIVA":      "suportecomercial1@empresa.exemplo",
  "FELIPE CASTRO":                   "saopaulo03@empresa.exemplo",
  "VANESSA RAMOS":  "minasgerais@empresa.exemplo",
  "LEONARDO NASCIMENTO":                 "regiaocampinas@empresa.exemplo",
  "TATIANE MOURA":                    "santacatarina@empresa.exemplo",
  "EDUARDO CAMPOS":                     "brasilia@empresa.exemplo",
  "SIMONE LOPES":                 "riograndedosul01@empresa.exemplo",
  "RODRIGO MACHADO":            "paraibaern@empresa.exemplo",
  "DANIELA FONSECA":                "riograndedosul02@empresa.exemplo",
  "MARCELO VIEIRA":              "matogrosso@empresa.exemplo",
  "PRISCILA BORGES":                   "regiaopiracicaba@empresa.exemplo",
  "HENRIQUE SANTANA":                 "saopaulo02@empresa.exemplo",
};

// E-mails da gestão que recebem cópia do relatório semanal.
// Preencha com os e-mails reais quando definir.
export const emailsGestao: string[] = [
  // "gestao@empresa.exemplo",
  // "mateus@empresa.exemplo",
];


// ── Tarifas de KM ───────────7─────────────────────────────────────

export const TARIFA_KM_PADRAO   = 1.30;
export const TARIFA_KM_ESPECIAL = 1.43;

// Executivos com tarifa diferenciada.
export const executivosTarifaEspecial = new Set<string>([
  "LUCAS MOREIRA",
  "VINICIUS CORREIA",
  "TATIANE MOURA",
  "SIMONE LOPES",
  "DANIELA FONSECA",
]);


// ── Atendentes ───────────────────────────────────────────────────
// Preencha com os nomes reais dos atendentes.
// Usado no campo "Atendente de Preferência" (etapa Agências).

export const listaAtendentes: string[] = [
  "Alessandro Dias",
    "Ana Teixeira",
    "Andrea Licastro",
    "Carlos Rodriguez",
    "Claudia Correa",
    "Cristiane Pereira",
    "Flavia Velloso",
    "Isabel Garcia",
    "Janaína Mussuri",
    "Juliana Bertolini",
    "Juliana Eboli",
    "Leandro Viana",
    "Mari Drefahl",
    "Mauricio Pimenta",
    "Michele Paim",
    "Nilsa Goulart",
    "Padilha de Morais",
    "Patricia Staggemeier",
    "Paula Lessa",
    "Rafael Biguetti",
    "Renata Esteves",
    "Talitha Asquini"
];


// ── Faturamento anual ────────────────────────────────────────────

export interface OpcaoFaturamento {
  value: string;
  label: string;
}

export const faturamentoAnualOpcoes: OpcaoFaturamento[] = [
  { value: "10000-30000",    label: "10 mil a 30 mil" },
  { value: "30000-50000",    label: "30 mil a 50 mil" },
  { value: "50000-100000",   label: "50 mil a 100 mil" },
  { value: "100000-250000",  label: "100 mil a 250 mil" },
  { value: "250000-500000",  label: "250 mil a 500 mil" },
  { value: "500000-1000000", label: "500 mil a 1.000.000 milhão" },
];


// ── Produtos ─────────────────────────────────────────────────────

export const produtosAgencia: string[] = [
  "Grupos com Guia",
  "Cruzeiros",
  "Turismo de Luxo",
  "Nacional",
  "Disney",
  "Europa",
  "Exóticos",
  "Caribe",
  "América do Sul",
  "Bloqueios Aéreos",
  "Grupos Fechados",
  "Corporativo",
];


// ── Níveis de estresse ───────────────────────────────────────────

export interface NivelEstresse {
  nome: string;
  exigeDescricao: boolean;
  descricao: string;
}

export const niveisEstresse: NivelEstresse[] = [
  {
    nome: "Baixo",
    exigeDescricao: false,
    descricao:
      "O cliente demonstra total confiança no trabalho, valida ações " +
      "com facilidade e a comunicação flui de forma leve e colaborativa. " +
      "Não há ruídos e o risco de perda da conta é zero.",
  },
  {
    nome: "Médio",
    exigeDescricao: true,
    descricao:
      "O cliente está focado e exige agilidade devido às demandas. " +
      "Há cobranças por ações e entregas, mas tudo ocorre de forma " +
      "profissional e dentro do esperado para o negócio. O risco de " +
      "perda é mínimo.",
  },
  {
    nome: "Alto",
    exigeDescricao: true,
    descricao:
      "O cliente apresenta irritabilidade frequente, reclama de atrasos " +
      "ou retrabalhos e demonstra desgaste com os processos atuais. Há " +
      "ruídos constantes na comunicação e o risco de perda é real caso " +
      "não haja uma mudança imediata.",
  },
  {
    nome: "Crítico",
    exigeDescricao: true,
    descricao:
      "O cliente demonstra apatia total com as entregas, realiza " +
      "cobranças em tom de ultimato ou reduziu drasticamente o contato. " +
      "Existem sinais claros de que está buscando outra agência. O risco " +
      "de perda é iminente.",
  },
];


// ── Setores ──────────────────────────────────────────────────────

export const setoresEstresse: string[] = [
  "Aéreo Bloqueio",
  "Aéreo Regular",
  "Comercial",
  "Marketing",
  "Atendimento",
  "Produtos",
  "Financeiro",
  "Pós-Venda",
];

export const setoresAcao: string[] = [
  "Aéreo Regular",
  "Aéreo Bloqueio",
  "Comercial",
  "Atendimento",
  "Financeiro",
  "Marketing",
  "Pós-venda",
];


// ── Categorias de despesa ────────────────────────────────────────

export const categoriasDespesa: string[] = [
  "Alimentação",
  "Hospedagem",
  "Transporte",
  "Material de escritório",
  "Outros",
];


// ── Fluxos de navegação ──────────────────────────────────────────

export type NomeEtapa =
  | "identificacao"
  | "visita"
  | "agencias"
  | "despesas"
  | "resumo";

export type NomeFluxo = "visita" | "despesas";

export const FLUXOS: Record<NomeFluxo, NomeEtapa[]> = {
  visita:   ["identificacao", "visita", "agencias", "resumo"],
  despesas: ["identificacao", "despesas", "resumo"],
};

export const ROTULOS_ETAPA: Record<NomeEtapa, string> = {
  identificacao: "Identificação",
  visita:        "Visita",
  agencias:      "Agências",
  despesas:      "Despesas",
  resumo:        "Resumo",
};

export const ROTULOS_FLUXO: Record<NomeFluxo, string> = {
  visita:   "Relatório de Visita",
  despesas: "Relatório de Despesas",
};

export const ORDEM_GERAL_ETAPAS: NomeEtapa[] = [
  "identificacao",
  "despesas",
  "visita",
  "agencias",
  "resumo",
];


// ── Data picker ──────────────────────────────────────────────────

export const NOMES_MESES: string[] = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const DATA_ANOS_PARA_TRAS   = 100;
export const DATA_ANOS_PARA_FRENTE = 5;


// ── Busca de ruas (ViaCEP) ───────────────────────────────────────

export const RUAS_TAMANHO_MINIMO = 3;
export const RUAS_DEBOUNCE_MS    = 400;


// ── Scroll reveal ────────────────────────────────────────────────

export const SCROLL_REVEAL_SELETOR =
  ".campo, .resumo-card, .resumo-totais, .resumo-card-salvo";


// ── LocalStorage ─────────────────────────────────────────────────

export const CHAVE_STORAGE = "cativa_dias_salvos";