// ================================================================
// CONFIG — EXECUTIVOS
// Mapa nome → e-mail. Ao selecionar o nome na aba Identificação,
// o e-mail é preenchido automaticamente.
// Para incluir um executivo novo, basta acrescentar uma linha.
// ================================================================

export const emailsExecutivos: Record<string, string> = {
  "LUCAS MOREIRA": "parana@empresa.exemplo",
  "ANA CARVALHO": "riodejaneiro@empresa.exemplo",
  "RAFAEL TEIXEIRA": "pernambuco@empresa.exemplo",
  "BEATRIZ ARAUJO": "riodejaneiro02@empresa.exemplo",
  "THIAGO BARBOSA": "baixadasantista@empresa.exemplo",
  "LARISSA CARDOSO": "norte@empresa.exemplo",
  "MATEUS PINTO": "bahiasergipe@empresa.exemplo",
  "PATRICIA GOMES": "ribeiraoetriangulo@empresa.exemplo",
  "VINICIUS CORREIA": "parana02@empresa.exemplo",
  "ALINE FREITAS": "goias@empresa.exemplo",
  "EXECUTIVO INTERNO CATIVA": "suportecomercial1@empresa.exemplo",
  "FELIPE CASTRO": "saopaulo03@empresa.exemplo",
  "VANESSA RAMOS": "minasgerais@empresa.exemplo",
  "LEONARDO NASCIMENTO": "regiaocampinas@empresa.exemplo",
  "TATIANE MOURA": "santacatarina@empresa.exemplo",
  "EDUARDO CAMPOS": "brasilia@empresa.exemplo",
  "SIMONE LOPES": "riograndedosul01@empresa.exemplo",
  "RODRIGO MACHADO": "paraibaern@empresa.exemplo",
  "DANIELA FONSECA": "riograndedosul02@empresa.exemplo",
  "MARCELO VIEIRA": "matogrosso@empresa.exemplo",
  "PRISCILA BORGES": "regiaopiracicaba@empresa.exemplo",
  "HENRIQUE SANTANA": "saopaulo02@empresa.exemplo",
};

/**
 * Lista para o <select> da aba Identificação.
 * `valor` é a chave usada nas regras (tarifa, e-mail);
 * `rotulo` é o que o executivo lê na tela — por isso alguns
 * aparecem acentuados aqui e sem acento no valor.
 */
export const executivos: { valor: string; rotulo: string }[] = [
  { valor: "LUCAS MOREIRA", rotulo: "LUCAS MOREIRA" },
  { valor: "ANA CARVALHO", rotulo: "ANA CARVALHO" },
  { valor: "RAFAEL TEIXEIRA", rotulo: "RAFAEL TEIXEIRA" },
  { valor: "BEATRIZ ARAUJO", rotulo: "BEATRIZ ARAUJO" },
  { valor: "THIAGO BARBOSA", rotulo: "THIAGO BARBOSA" },
  { valor: "LARISSA CARDOSO", rotulo: "LARISSA CARDOSO" },
  { valor: "MATEUS PINTO", rotulo: "MATEUS PINTO" },
  { valor: "PATRICIA GOMES", rotulo: "PATRICIA GOMES" },
  { valor: "VINICIUS CORREIA", rotulo: "VINICIUS CORREIA" },
  { valor: "ALINE FREITAS", rotulo: "ALINE FREITAS" },
  { valor: "FELIPE CASTRO", rotulo: "FELIPE CASTRO" },
  { valor: "VANESSA RAMOS", rotulo: "VANESSA RAMOS" },
  { valor: "LEONARDO NASCIMENTO", rotulo: "LEONARDO NASCIMENTO" },
  { valor: "TATIANE MOURA", rotulo: "TATIANE MOURA" },
  { valor: "EDUARDO CAMPOS", rotulo: "EDUARDO CAMPOS" },
  { valor: "SIMONE LOPES", rotulo: "SIMONE LOPES" },
  { valor: "RODRIGO MACHADO", rotulo: "RODRIGO MACHADO" },
  { valor: "DANIELA FONSECA", rotulo: "DANIELA FONSECA" },
  { valor: "MARCELO VIEIRA", rotulo: "MARCELO VIEIRA" },
  { valor: "PRISCILA BORGES", rotulo: "PRISCILA BORGES" },
  { valor: "HENRIQUE SANTANA", rotulo: "HENRIQUE SANTANA" },
];

/**
 * E-mails da gestão que recebem cópia do relatório semanal.
 * Preencher quando o envio por e-mail for implementado.
 */
export const emailsGestao: string[] = [];
