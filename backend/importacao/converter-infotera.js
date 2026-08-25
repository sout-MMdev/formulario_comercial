// ================================================================
// CONVERSOR — planilha do Infotera -> agencias_novo.csv
//
// A planilha do Infotera vem com ";" como delimitador, campos entre
// aspas e ~30 colunas. Este script extrai só o que o banco precisa e
// gera um CSV limpo (vírgula) pronto pro import na tabela stg_import.
//
// Uso:
//   node converter-infotera.js <arquivo-do-infotera.csv>
//
// Gera "agencias_novo.csv" na mesma pasta do arquivo de entrada.
// ================================================================

const fs = require("fs");
const path = require("path");

const entrada = process.argv[2];
if (!entrada) {
  console.error("Uso: node converter-infotera.js <arquivo-do-infotera.csv>");
  process.exit(1);
}

let raw = fs.readFileSync(entrada, "utf8");
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // tira o BOM

// Parser de CSV de verdade: respeita aspas ("), aspas escapada (""),
// o delimitador informado e quebras de linha DENTRO de campos.
function parseCSV(txt, delim) {
  const linhas = [];
  let campo = "";
  let linha = [];
  let aspas = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (aspas) {
      if (ch === '"') {
        if (txt[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          aspas = false;
        }
      } else {
        campo += ch;
      }
    } else if (ch === '"') {
      aspas = true;
    } else if (ch === delim) {
      linha.push(campo);
      campo = "";
    } else if (ch === "\n") {
      linha.push(campo);
      linhas.push(linha);
      campo = "";
      linha = [];
    } else if (ch !== "\r") {
      campo += ch;
    }
  }
  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

const t = (s) => (s == null ? "" : s).trim();

// Coloca aspas se o campo tiver vírgula, aspas ou quebra de linha (sem regex).
function csv(v) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return '"' + v.split('"').join('""') + '"';
  }
  return v;
}

// Colunas do Infotera (0-indexado): 0 Id · 1 Nome · 2 Razão Social ·
// 4 CNPJ · 5 CPF · 6 CEP · 7 Endereço · 8 Cidade · 9 Estado · 10 Bairro ·
// 15 Promotor · 20 Comissão · 21 Ativo?.
const rows = parseCSV(raw, ";");
const saida = [
  "id_infotera,nome,cnpj,cep,endereco,cidade,estado,bairro,promotor,comissao,ativa",
];
const promotores = {};
const ids = new Set();
let malformadas = 0;
let semId = 0;
let duplicados = 0;

for (let i = 1; i < rows.length; i++) {
  const c = rows[i];
  if (c.length < 22) {
    malformadas++;
    continue;
  }
  const id = t(c[0]);
  if (!id) {
    semId++;
    continue;
  }
  if (ids.has(id)) {
    duplicados++;
    continue;
  }
  ids.add(id);

  const nome = t(c[1]) || t(c[2]); // Nome, ou Razão Social se vazio
  const cnpj = t(c[4]) || t(c[5]); // CNPJ, ou CPF (MEI)
  const promotor = t(c[15]).toUpperCase(); // padroniza p/ casar com os executivos
  if (promotor) promotores[promotor] = (promotores[promotor] || 0) + 1;

  const linha = [
    id,
    nome,
    cnpj,
    t(c[6]),
    t(c[7]),
    t(c[8]),
    t(c[9]),
    t(c[10]),
    promotor,
    t(c[20]),
    t(c[21]),
  ];
  saida.push(linha.map(csv).join(","));
}

const dir = path.dirname(path.resolve(entrada));
fs.writeFileSync(path.join(dir, "agencias_novo.csv"), saida.join("\n"), "utf8");

console.log("agencias_novo.csv gerado.");
console.log("  agencias:", saida.length - 1);
console.log("  malformadas puladas:", malformadas, "| sem id:", semId, "| duplicados:", duplicados);
console.log("  executivos (promotores) distintos:", Object.keys(promotores).length);
