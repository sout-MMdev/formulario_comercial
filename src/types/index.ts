// ================================================================
// TIPOS — define a "forma" de cada dado do sistema.
// O TypeScript usa essas interfaces para avisar no VS Code
// se você tentar acessar um campo que não existe ou passar
// o tipo errado para uma função.
// ================================================================

// ── Etapa 1: Identificação ──────────────────────────────────────

/** Dados do executivo que está preenchendo o relatório. */
export interface Identificacao {
  nome: string;
  email: string;
}


// ── Etapa 2: Visita (trajeto do dia) ─────────────────────────────

/** Um trajeto de visita (ida e volta ou trecho). */
export interface Trajeto {
  data: string;            // formato "YYYY-MM-DD"
  partida: string;         // cidade de partida
  destino: string;         // cidade de destino
  km: number;
  reembolsoKm: number;     // calculado: km × tarifa
  agencias: string[];      // agências visitadas nesse trecho
}


// ── Etapa 3: Agências (dados comerciais + termômetro) ────────────

/** Registro de estresse por setor em uma agência. */
export interface RegistroEstresse {
  nivel: string;           // "Baixo" | "Médio" | "Alto" | "Crítico"
  setores: string[];       // setores envolvidos
  descricao: string;       // relato do ocorrido (obrigatório se médio+)
}

/** Ação combinada com um setor específico. */
export interface AcaoAcordada {
  setor: string;           // nome do setor
  detalhe: string;         // o que foi combinado
}

/** Dados comerciais e termômetro de uma agência visitada. */
export interface AgenciaComercial {
  nome: string;
  dataFundacao: string;
  faturamentoAnual: string;
  faturamentoAnualLabel: string;
  produtos: string[];
  atendentes: string[];
  estresses: RegistroEstresse[];
  acoes: AcaoAcordada[];
}


// ── Etapa 4: Despesas ────────────────────────────────────────────

/** Uma despesa com nota fiscal. */
export interface Despesa {
  data: string;
  cidade: string;
  descricao: string;
  valor: number;
  nomeArquivo: string;     // nome do arquivo anexado
}

/** Um trajeto dentro do relatório de despesas. */
export interface TrajetoDespesa {
  data: string;
  partida: string;
  destino: string;
  km: number;
  reembolsoKm: number;
}


// ── Resumo e armazenamento ───────────────────────────────────────

/** Um dia completo de trabalho salvo no sistema. */
export interface DiaSalvo {
  id: number;              // timestamp usado como ID único
  salvadoEm: string;       // data/hora formatada "dd/mm/aaaa hh:mm"
  identificacao: Identificacao;
  trajetos: Trajeto[];
  agencias: AgenciaComercial[];
  despesas: Despesa[];
  trajetosDespesa: TrajetoDespesa[];
}


// ── Cidade (resposta da API do IBGE) ─────────────────────────────

export interface Cidade {
  nome: string;
  estado: string;          // sigla UF
  label: string;           // "Curitiba - PR"
}


// ── Rua (resposta do ViaCEP) ─────────────────────────────────────

export interface Rua {
  rua: string;
  bairro: string;
  cep: string;
  label: string;           // "Rua XV de Novembro - Centro"
}


// ── Componentes de UI ────────────────────────────────────────────

/** Opções para o componente de data customizado. */
export interface CampoDataOpcoes {
  name: string;
  id?: string;
  required?: boolean;
}

/** Opções para o componente de multiselect. */
export interface MultiSelectOpcoes {
  name: string;
  opcoes: string[];
  placeholder?: string;
}