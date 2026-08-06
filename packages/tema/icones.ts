// ================================================================
// TEMA — TRAÇADOS DOS ÍCONES
// Só dados: cada entrada é o atributo `d` de um <path> em uma
// viewBox 24×24. Não importa React, então serve aos dois apps —
// cada um monta o seu próprio componente <Icone> em cima disto.
//
// Para adicionar um ícone: uma linha aqui e ele existe nos dois.
// ================================================================

export const trilhasIcone = {
  // Navegação
  seta_direita: "M5 12h14M13 6l6 6-6 6",
  seta_esquerda: "M19 12H5M11 18l-6-6 6-6",
  seta_baixo: "M6 9l6 6 6-6",
  seta_cima: "M18 15l-6-6-6 6",

  // Ações
  mais: "M12 5v14M5 12h14",
  fechar: "M18 6L6 18M6 6l12 12",
  checar: "M20 6L9 17l-5-5",
  lixeira:
    "M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  editar: "M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z",

  // Objetos
  calendario:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  carro:
    "M5 17h14M6.5 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 14l1.5-5A2 2 0 016.4 7.5h11.2A2 2 0 0119.5 9L21 14v3H3v-3z",
  predio:
    "M3 21h18M6 21V4a1 1 0 011-1h10a1 1 0 011 1v17M10 8h1M13 8h1M10 12h1M13 12h1M10 16h1M13 16h1",
  carteira: "M3 8a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8zM3 10h18M16 14h2",
  clipe:
    "M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.49",
  documento: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4",
  usuario: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  email: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  mapa: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  termometro: "M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z",
  alvo: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
  grafico: "M3 3v18h18M7 15l4-4 3 3 5-6",
  camera:
    "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
  lista: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",

  // Sinalização
  informacao: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01",
  alerta:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  sucesso: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
  salvar: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
} as const;

export type NomeIcone = keyof typeof trilhasIcone;
