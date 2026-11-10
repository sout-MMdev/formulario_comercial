// ================================================================
// CONFIG — EXECUTIVOS (FALLBACK FICTÍCIO)
// Mapa nome → e-mail usado APENAS como fallback quando não há back end
// configurado (portfólio/desenvolvimento/offline).
//
// Em produção, a lista REAL vem do Supabase (Edge Function
// `listar-executivos`) — nenhum nome/e-mail real fica no repositório
// (LGPD). Os nomes abaixo são FICTÍCIOS, só pra demonstração.
// ================================================================

export const emailsExecutivos: Record<string, string> = {
  "BRUNO ROCHA": "sul01@empresa.exemplo",
  "DIEGO MARTINS": "sul02@empresa.exemplo",
  "CARLOS NUNES": "santacatarina@empresa.exemplo",
  "FERNANDA LIMA": "parana@empresa.exemplo",
  "RENATA DIAS": "parana02@empresa.exemplo",
  "PAULO SOUZA": "saopaulo@empresa.exemplo",
  "MARIANA COSTA": "norte@empresa.exemplo",
  "RICARDO ALVES": "riodejaneiro@empresa.exemplo",
  "JULIANA PEREIRA": "bahia@empresa.exemplo",
  "ANDRÉ OLIVEIRA": "minasgerais@empresa.exemplo",
  "CAMILA RIBEIRO": "goias@empresa.exemplo",
  "GUSTAVO MENDES": "brasilia@empresa.exemplo",
};

/**
 * Lista para o <select> da aba Identificação.
 * `valor` é a chave usada nas regras (tarifa, e-mail);
 * `rotulo` é o que aparece na tela.
 */
export const executivos: { valor: string; rotulo: string }[] = [
  { valor: "BRUNO ROCHA", rotulo: "BRUNO ROCHA" },
  { valor: "DIEGO MARTINS", rotulo: "DIEGO MARTINS" },
  { valor: "CARLOS NUNES", rotulo: "CARLOS NUNES" },
  { valor: "FERNANDA LIMA", rotulo: "FERNANDA LIMA" },
  { valor: "RENATA DIAS", rotulo: "RENATA DIAS" },
  { valor: "PAULO SOUZA", rotulo: "PAULO SOUZA" },
  { valor: "MARIANA COSTA", rotulo: "MARIANA COSTA" },
  { valor: "RICARDO ALVES", rotulo: "RICARDO ALVES" },
  { valor: "JULIANA PEREIRA", rotulo: "JULIANA PEREIRA" },
  { valor: "ANDRÉ OLIVEIRA", rotulo: "ANDRÉ OLIVEIRA" },
  { valor: "CAMILA RIBEIRO", rotulo: "CAMILA RIBEIRO" },
  { valor: "GUSTAVO MENDES", rotulo: "GUSTAVO MENDES" },
];

/**
 * E-mails da gestão que recebem cópia do relatório semanal.
 * Em produção vêm do back end; vazio no fallback fictício.
 */
export const emailsGestao: string[] = [];
