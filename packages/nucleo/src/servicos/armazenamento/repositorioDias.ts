// ================================================================
// SERVIÇO — REPOSITÓRIO DE DIAS
// TODA a persistência do sistema passa por esta interface.
//
// >>> PONTO DE INTEGRAÇÃO COM O CRM <<<
// Quando o backend existir, crie um `repositorioApi.ts` que
// implemente esta mesma interface com fetch() e troque a linha
// final de `index.ts`. Nenhum componente precisa mudar.
// ================================================================

import type { DiaSalvo } from "../../tipos/index.ts";

export interface RepositorioDias {
  /** Todos os dias já salvos, do mais antigo ao mais recente. */
  listar(): Promise<DiaSalvo[]>;

  /** Grava um dia novo e devolve a lista atualizada. */
  salvar(dia: DiaSalvo): Promise<DiaSalvo[]>;

  /** Remove um dia pelo ID e devolve a lista atualizada. */
  excluir(id: number): Promise<DiaSalvo[]>;

  /** Apaga tudo — usado após o envio do relatório semanal. */
  limpar(): Promise<void>;
}
