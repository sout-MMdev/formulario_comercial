// ================================================================
// ÍCONES (desktop) — CATÁLOGO DE NOMES
// Só a lista dos nomes que o app pode pedir. O desenho de cada nome
// fica no mapa de Icone.tsx (aponta para o Bootstrap Icons).
//
// Este catálogo é SÓ do desktop — o mobile tem o seu próprio, então
// os dois podem divergir sem um afetar o outro.
//
// Ícone novo: uma linha aqui e uma no mapa BOOTSTRAP de Icone.tsx.
// O TypeScript cobra a segunda se você esquecer.
// ================================================================

export const nomesIcone = [
  // Navegação
  "seta_direita",
  "seta_esquerda",
  "seta_baixo",
  "seta_cima",

  // Ações
  "mais",
  "fechar",
  "checar",
  "lixeira",
  "editar",

  // Objetos
  "calendario",
  "carro",
  "predio",
  "carteira",
  "clipe",
  "documento",
  "usuario",
  "email",
  "mapa",
  "termometro",
  "alvo",
  "grafico",
  "camera",
  "lista",

  // Sinalização
  "informacao",
  "alerta",
  "sucesso",
  "salvar",
] as const;

export type NomeIcone = (typeof nomesIcone)[number];
