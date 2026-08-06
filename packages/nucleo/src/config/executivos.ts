// ================================================================
// CONFIG — EXECUTIVOS
// Mapa nome → e-mail. Ao selecionar o nome na aba Identificação,
// o e-mail é preenchido automaticamente.
// Para incluir um executivo novo, basta acrescentar uma linha.
// ================================================================

export const emailsExecutivos: Record<string, string> = {
  "ADRIANA SCHLICHTA": "parana@cativaoperadora.com.br",
  "AFONSO HENRIQUE DOMINGUES": "riodejaneiro@cativaoperadora.com.br",
  "ALEX HENRIQUE GODOI DE MORAES": "pernambuco@cativaoperadora.com.br",
  "ALEXANDRE DIAS": "riodejaneiro02@cativaoperadora.com.br",
  "ALEXANDRE GOMES VAZ PINTO": "baixadasantista@cativaoperadora.com.br",
  "CAMILA FERNANDEZ": "norte@cativaoperadora.com.br",
  "CARLA MEIRA": "bahiasergipe@cativaoperadora.com.br",
  "CARLOS DONIZETI LEONARDI": "ribeiraoetriangulo@cativaoperadora.com.br",
  "DANIELA REIS": "parana02@cativaoperadora.com.br",
  "DENILSON MATEUCCI VICENTE": "goias@cativaoperadora.com.br",
  "EXECUTIVO INTERNO CATIVA": "suportecomercial1@cativaoperadora.com.br",
  "FABIO VIANA": "saopaulo03@cativaoperadora.com.br",
  "LUIZ CLAUDIO MARCIANO BARROS": "minasgerais@cativaoperadora.com.br",
  "MARCELO SOUZA": "regiaocampinas@cativaoperadora.com.br",
  "MARCOS TRE": "santacatarina@cativaoperadora.com.br",
  "NANY LIMA": "brasilia@cativaoperadora.com.br",
  "PABLO SANTANA": "riograndedosul01@cativaoperadora.com.br",
  "PRISCILLA BACALHAO": "paraibaern@cativaoperadora.com.br",
  "RAFAEL ANDRADE": "riograndedosul02@cativaoperadora.com.br",
  "ROBERTO LASTORIA": "matogrosso@cativaoperadora.com.br",
  "SAULO GODOY": "regiaopiracicaba@cativaoperadora.com.br",
  "TIAGO FANTINI": "saopaulo02@cativaoperadora.com.br",
};

/**
 * Lista para o <select> da aba Identificação.
 * `valor` é a chave usada nas regras (tarifa, e-mail);
 * `rotulo` é o que o executivo lê na tela — por isso alguns
 * aparecem acentuados aqui e sem acento no valor.
 */
export const executivos: { valor: string; rotulo: string }[] = [
  { valor: "ADRIANA SCHLICHTA", rotulo: "ADRIANA SCHLICHTA" },
  { valor: "AFONSO HENRIQUE DOMINGUES", rotulo: "AFONSO HENRIQUE DOMINGUES" },
  { valor: "ALEX HENRIQUE GODOI DE MORAES", rotulo: "ALEX HENRIQUE GODOI DE MORAES" },
  { valor: "ALEXANDRE DIAS", rotulo: "ALEXANDRE DIAS" },
  { valor: "ALEXANDRE GOMES VAZ PINTO", rotulo: "ALEXANDRE GOMES VAZ PINTO" },
  { valor: "CAMILA FERNANDEZ", rotulo: "CAMILA FERNANDEZ" },
  { valor: "CARLA MEIRA", rotulo: "CARLA MEIRA" },
  { valor: "CARLOS DONIZETI LEONARDI", rotulo: "CARLOS DONIZETI LEONARDI" },
  { valor: "DANIELA REIS", rotulo: "DANIELA REIS" },
  { valor: "DENILSON MATEUCCI VICENTE", rotulo: "DENILSON MATEUCCI VICENTE" },
  { valor: "FABIO VIANA", rotulo: "FÁBIO VIANA" },
  { valor: "LUIZ CLAUDIO MARCIANO BARROS", rotulo: "LUIZ CLAUDIO MARCIANO BARROS" },
  { valor: "MARCELO SOUZA", rotulo: "MARCELO SOUZA" },
  { valor: "MARCOS TRE", rotulo: "MARCOS TRE" },
  { valor: "NANY LIMA", rotulo: "NANY LIMA" },
  { valor: "PABLO SANTANA", rotulo: "PABLO SANTANA" },
  { valor: "PRISCILLA BACALHAO", rotulo: "PRISCILLA BACALHÁO" },
  { valor: "RAFAEL ANDRADE", rotulo: "RAFAEL ANDRADE" },
  { valor: "ROBERTO LASTORIA", rotulo: "ROBERTO LASTORIA" },
  { valor: "SAULO GODOY", rotulo: "SAULO GODOY" },
  { valor: "TIAGO FANTINI", rotulo: "TIAGO FANTINI" },
];

/**
 * E-mails da gestão que recebem cópia do relatório semanal.
 * Preencher quando o envio por e-mail for implementado.
 */
export const emailsGestao: string[] = [];
