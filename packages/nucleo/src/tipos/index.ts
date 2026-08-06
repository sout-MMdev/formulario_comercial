// ================================================================
// TIPOS — a "forma" de cada dado do sistema.
// Nenhum tipo aqui conhece React: são contratos puros de domínio,
// prontos para serem reaproveitados pelo backend/CRM.
// ================================================================

// ── Fluxo e etapas ───────────────────────────────────────────────

/** Cada aba do formulário. */
export type NomeEtapa =
  | "identificacao"
  | "visita"
  | "agencias"
  | "despesas"
  | "resumo";

/** Os dois relatórios que o executivo pode preencher. */
export type NomeFluxo = "visita" | "despesas";

// ── Identificação ────────────────────────────────────────────────

/** Dados do executivo que está preenchendo o relatório. */
export interface Identificacao {
  nome: string;
  email: string;
}

// ── Visita ───────────────────────────────────────────────────────

/** Uma agência listada na etapa Visita (só o nome, nesta etapa). */
export interface AgenciaVisitada {
  id: string;
  nome: string;
}

/** A etapa Visita inteira. */
export interface Visita {
  data: string; // "YYYY-MM-DD"
  agencias: AgenciaVisitada[];
}

// ── Agências (dados comerciais + termômetro) ─────────────────────

/** Registro de estresse por setor em uma agência. */
export interface RegistroEstresse {
  id: string;
  nivel: NomeNivelEstresse;
  setores: string[];
  descricao: string; // obrigatório a partir do nível Médio
}

/** Ação combinada com um setor específico. */
export interface AcaoAcordada {
  setor: string;
  detalhe: string;
}

/**
 * Endereço estruturado de uma agência.
 * O CEP é preenchido pelo ViaCEP (logradouro, bairro, cidade, uf);
 * número e complemento são digitados à mão (o ViaCEP não os fornece).
 */
export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Dados comerciais e termômetro de uma agência visitada. */
export interface AgenciaComercial {
  id: string; // espelha o id da AgenciaVisitada
  nome: string;
  dataFundacao: string;
  faturamentoAnual: string;
  faturamentoAnualLabel: string;
  endereco: Endereco;
  produtos: string[];
  atendentes: string[];
  estresses: RegistroEstresse[];
  acoes: AcaoAcordada[];
}

export type NomeNivelEstresse = "Baixo" | "Médio" | "Alto" | "Crítico";

/** Definição de um nível do termômetro. */
export interface NivelEstresse {
  nome: NomeNivelEstresse;
  exigeDescricao: boolean;
  descricao: string;
}

// ── Despesas ─────────────────────────────────────────────────────

/** Um trajeto com cálculo de reembolso por KM. */
export interface Trajeto {
  id: string;
  data: string;
  partida: string;
  destino: string;
  km: number;
  reembolsoKm: number; // calculado: km × tarifa do executivo
}

export type TipoCartao = "Cartão Pessoal" | "Cartão Clara";

/** Uma despesa lançada com cartão. */
export interface Despesa {
  id: string;
  data: string;
  cartao: TipoCartao | "";
  categoria: string;
  valor: number;
  nomeArquivo: string; // comprovante anexado
}

/** Como a despesa entra na conta do reembolso. */
export type SituacaoDespesa = "reembolsado" | "descontado" | "informativo";

// ── Totais ───────────────────────────────────────────────────────

/** Fechamento financeiro de um dia. */
export interface TotaisDia {
  totalKm: number; // soma dos reembolsos de trajeto
  totalPessoal: number; // despesas no Cartão Pessoal
  totalAbastecimentoClara: number; // abastecimento no Cartão Clara (desconto)
  totalFinal: number; // totalKm + totalPessoal − abastecimento Clara
  kmRodado: number; // soma dos KM (informativo)
}

// ── O dia inteiro ────────────────────────────────────────────────

/** Estado completo do formulário em preenchimento. */
export interface RelatorioDia {
  identificacao: Identificacao;
  visita: Visita;
  agenciasComercial: AgenciaComercial[];
  trajetos: Trajeto[];
  despesas: Despesa[];
  fluxosAdicionados: NomeFluxo[];
}

/** Um dia já salvo no armazenamento. */
export interface DiaSalvo {
  id: number; // timestamp — ID único
  salvadoEm: string; // "dd/mm/aaaa hh:mm"
  fluxos: NomeFluxo[];
  identificacao: Identificacao;
  visita: Visita;
  agenciasVisitadas: string[];
  agenciasComercial: AgenciaComercial[];
  trajetos: Trajeto[];
  despesas: Despesa[];
}

// ── Integrações externas ─────────────────────────────────────────

/** Município retornado pela API do IBGE. */
export interface Cidade {
  nome: string;
  estado: string; // sigla UF
  label: string; // "Curitiba - PR"
}

/** Logradouro retornado pelo ViaCEP. */
export interface Rua {
  rua: string;
  bairro: string;
  cep: string;
  label: string; // "Rua XV de Novembro - Centro"
}

// ── Utilidades de UI ─────────────────────────────────────────────

/** Par valor/rótulo para selects. */
export interface Opcao {
  value: string;
  label: string;
}
