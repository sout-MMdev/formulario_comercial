// ==============================================================
// Tipos do banco (schema `app`) — FONTE ÚNICA de verdade dos tipos.
//
// Espelha exatamente as migrations em backend/supabase/migrations/.
// Os dois fronts (CRM e formulário) importam daqui, então os valores de
// `perfil`, `nivel`, `status` etc. param de ser copiados à mão em cada lado.
//
// Pode ser regenerado no futuro com:  supabase gen types typescript
// (quando ligarmos a integração Supabase↔GitHub na fase 8).
// ==============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [chave: string]: Json | undefined }
  | Json[];

// ---- Valores fixos (CHECK constraints do banco) ----
export type PerfilUsuario = "Administrador" | "Gestor" | "Executivo" | "Operacional";
export type StatusAgencia = "Ativa" | "Inativa" | "Em recuperação" | "Prospecção";
export type NivelEstresse = "Baixo" | "Médio" | "Alto" | "Crítico";
export type StatusDespesa = "Pendente" | "Reembolsada" | "Não reembolsável";
export type OrigemHistorico = "sistema" | "manual";

// ---- Estrutura do banco (formato do supabase-js) ----
export interface Database {
  app: {
    Tables: {
      executivos: {
        Row: {
          id: number;
          nome: string;
          email: string;
          perfil: PerfilUsuario;
          setor: string | null;
          ativo: boolean;
          auth_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: never; // gerado pelo banco (identity)
          nome: string;
          email: string;
          perfil?: PerfilUsuario;
          setor?: string | null;
          ativo?: boolean;
          auth_id?: string | null;
          criado_em?: string;
        };
        Update: {
          nome?: string;
          email?: string;
          perfil?: PerfilUsuario;
          setor?: string | null;
          ativo?: boolean;
          auth_id?: string | null;
        };
      };
      agencias: {
        Row: {
          id: number;
          nome: string;
          uf: string | null;
          executivo_id: number | null;
          status: StatusAgencia;
          data_fundacao: string | null;
          observacoes: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: never;
          nome: string;
          uf?: string | null;
          executivo_id?: number | null;
          status?: StatusAgencia;
          data_fundacao?: string | null;
          observacoes?: string | null;
        };
        Update: {
          nome?: string;
          uf?: string | null;
          executivo_id?: number | null;
          status?: StatusAgencia;
          data_fundacao?: string | null;
          observacoes?: string | null;
          atualizado_em?: string;
        };
      };
      visitas: {
        Row: {
          id: number;
          executivo_id: number;
          data_visita: string;
          criado_em: string;
        };
        Insert: {
          id?: never;
          executivo_id: number;
          data_visita: string;
        };
        Update: {
          executivo_id?: number;
          data_visita?: string;
        };
      };
      agencia_visita: {
        Row: {
          id: number;
          visita_id: number;
          agencia_id: number;
          faturamento_anual: string | null;
          produtos: Json;
          atendentes: Json;
          acoes: Json;
        };
        Insert: {
          id?: never;
          visita_id: number;
          agencia_id: number;
          faturamento_anual?: string | null;
          produtos?: Json;
          atendentes?: Json;
          acoes?: Json;
        };
        Update: {
          faturamento_anual?: string | null;
          produtos?: Json;
          atendentes?: Json;
          acoes?: Json;
        };
      };
      estresse_agencia: {
        Row: {
          id: number;
          agencia_id: number;
          executivo_id: number | null;
          visita_id: number | null;
          nivel: NivelEstresse;
          setores: Json;
          descricao: string | null;
          data_registro: string;
          criado_em: string;
        };
        Insert: {
          id?: never;
          agencia_id: number;
          executivo_id?: number | null;
          visita_id?: number | null;
          nivel: NivelEstresse;
          setores?: Json;
          descricao?: string | null;
          data_registro?: string;
        };
        Update: {
          nivel?: NivelEstresse;
          setores?: Json;
          descricao?: string | null;
        };
      };
      despesas: {
        Row: {
          id: number;
          executivo_id: number;
          data: string;
          cartao: string | null;
          categoria: string | null;
          valor: number;
          status: StatusDespesa;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: never;
          executivo_id: number;
          data: string;
          cartao?: string | null;
          categoria?: string | null;
          valor: number;
          status?: StatusDespesa;
        };
        Update: {
          data?: string;
          cartao?: string | null;
          categoria?: string | null;
          valor?: number;
          status?: StatusDespesa;
          atualizado_em?: string;
        };
      };
      notas_fiscais: {
        Row: {
          id: number;
          despesa_id: number;
          arquivo_url: string;
          nome_arquivo: string | null;
          criado_em: string;
        };
        Insert: {
          id?: never;
          despesa_id: number;
          arquivo_url: string;
          nome_arquivo?: string | null;
        };
        Update: {
          arquivo_url?: string;
          nome_arquivo?: string | null;
        };
      };
      historico_agencia: {
        Row: {
          id: number;
          agencia_id: number;
          executivo_id: number | null;
          tipo_evento: string;
          descricao: string | null;
          setor: string | null;
          origem: OrigemHistorico;
          data_evento: string;
          criado_em: string;
        };
        Insert: {
          id?: never;
          agencia_id: number;
          executivo_id?: number | null;
          tipo_evento: string;
          descricao?: string | null;
          setor?: string | null;
          origem?: OrigemHistorico;
          data_evento?: string;
        };
        Update: {
          tipo_evento?: string;
          descricao?: string | null;
          setor?: string | null;
          origem?: OrigemHistorico;
        };
      };
    };
  };
}

// ---- Atalhos por tabela (linha lida do banco) ----
export type Executivo = Database["app"]["Tables"]["executivos"]["Row"];
export type Agencia = Database["app"]["Tables"]["agencias"]["Row"];
export type Visita = Database["app"]["Tables"]["visitas"]["Row"];
export type AgenciaVisita = Database["app"]["Tables"]["agencia_visita"]["Row"];
export type EstresseAgencia = Database["app"]["Tables"]["estresse_agencia"]["Row"];
export type Despesa = Database["app"]["Tables"]["despesas"]["Row"];
export type NotaFiscal = Database["app"]["Tables"]["notas_fiscais"]["Row"];
export type HistoricoAgencia = Database["app"]["Tables"]["historico_agencia"]["Row"];
