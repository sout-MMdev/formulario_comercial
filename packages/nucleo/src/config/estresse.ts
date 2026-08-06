// ================================================================
// CONFIG — TERMÔMETRO DE SATISFAÇÃO
// Níveis de estresse (com o texto do pop-up explicativo) e os
// setores que podem ser envolvidos.
// ================================================================

import type { NivelEstresse, NomeNivelEstresse } from "../tipos/index.ts";

/**
 * Os quatro níveis, do menor para o maior risco de churn.
 * `exigeDescricao` = o executivo precisa relatar o ocorrido.
 */
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

/**
 * Sufixo de classe CSS de cada nível — usado como `nivel--${sufixo}`.
 * Mapa explícito (em vez de derivar da string com removerAcentos): se um
 * nível novo for adicionado, o TypeScript obriga a definir a classe aqui.
 */
export const CLASSE_NIVEL_ESTRESSE: Record<NomeNivelEstresse, string> = {
  Baixo: "baixo",
  Médio: "medio",
  Alto: "alto",
  Crítico: "critico",
};

/** Setores que podem estar envolvidos em um registro de estresse. */
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

/** Setores com quem se pode combinar uma ação. */
export const setoresAcao: string[] = [
  "Aéreo Regular",
  "Aéreo Bloqueio",
  "Comercial",
  "Atendimento",
  "Financeiro",
  "Marketing",
  "Pós-venda",
];
