// ================================================================
// TIPOS DO SERVIDOR
// O formato dos dados entre as Edge Functions e o banco. Os nomes em
// snake_case são os mesmos das colunas e do payload de
// public.registrar_relatorio (migration 20261110171204).
// ================================================================

import type { NomeFluxo, NomeNivelEstresse, TipoCartao } from "./nucleo.ts";

/** Executivo como está no banco (tabela executivos). */
export interface ExecutivoCadastrado {
  id: number;
  nome: string;
  email: string;
  tarifaKm: number;
}

export interface EstresseParaGravar {
  nivel: NomeNivelEstresse;
  setores: string[];
  descricao: string | null;
}

export interface AcaoParaGravar {
  setor: string;
  detalhe: string;
}

export interface AgenciaParaGravar {
  nome: string;
  data_fundacao: string | null;
  faturamento_anual: string | null;
  faturamento_anual_rotulo: string | null;
  produtos: string[];
  atendentes: string[];
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  estresses: EstresseParaGravar[];
  acoes: AcaoParaGravar[];
}

export interface TrajetoParaGravar {
  data: string | null;
  partida: string | null;
  destino: string | null;
  km: number;
  tarifa_km: number;
  reembolso: number;
}

export interface DespesaParaGravar {
  data: string | null;
  cartao: TipoCartao | null;
  categoria: string | null;
  valor: number;
  nome_comprovante: string | null;
}

/** Payload de registrar_relatorio: o dia inteiro, já recalculado. */
export interface RelatorioParaGravar {
  executivo_id: number;
  id_cliente: number;
  fluxos: NomeFluxo[];
  data_visita: string | null;
  total_km: number;
  total_pessoal: number;
  total_abastecimento_clara: number;
  total_final: number;
  km_rodado: number;
  agencias: AgenciaParaGravar[];
  trajetos: TrajetoParaGravar[];
  despesas: DespesaParaGravar[];
}

/** A cópia do relatório que vai por e-mail para o executivo. */
export interface MensagemEmail {
  para: string;
  nomePara: string;
  assunto: string;
  texto: string;
}

/** Uma tentativa de envio, gravada em emails_enviados. */
export interface RegistroEmail {
  relatorioId: number;
  destino: string;
  assunto: string;
  situacao: "enviado" | "falhou";
  detalheErro: string | null;
}
