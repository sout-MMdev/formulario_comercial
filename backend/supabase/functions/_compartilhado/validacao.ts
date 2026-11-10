// ================================================================
// VALIDAÇÃO DO CORPO RECEBIDO
// O navegador pode ser alterado por quem quiser, então o servidor
// confere tudo de novo, em duas camadas:
//
// 1. Estrutura: tipo de cada campo, limites de quantidade e tamanho,
//    datas reais (AAAA-MM-DD) e valores permitidos. Protege o banco
//    de lixo e de corpos gigantes.
// 2. Regras de negócio: as MESMAS funções que a tela usa (núcleo),
//    nas mesmas condições e com as mesmas mensagens.
//
// Escrita à mão, sem biblioteca, para cada regra ficar visível.
// Arquivo puro: testado no Node (backend/testes/unidade/validacao.teste.ts).
// ================================================================

import {
  validarDespesas,
  validarIdentificacao,
  validarRegistroEstresse,
  validarSalvarDia,
  validarVisita,
} from "./nucleo.ts";
import type { DiaSalvo, NomeNivelEstresse } from "./nucleo.ts";

export type ResultadoValidacaoDia =
  | { ok: true; dia: DiaSalvo }
  | { ok: false; erro: string };

// ── Limites (decisões do projeto) ────────────────────────────────
export const LIMITES = {
  agencias: 30,
  trajetos: 50,
  despesas: 50,
  estressesPorAgencia: 10,
  acoesPorAgencia: 20,
  itensPorLista: 50, // produtos, atendentes, setores
  texto: 300,
  textoLongo: 2000, // descrição do estresse e detalhe da ação
  kmMaximo: 5000,
  valorMaximo: 100000,
} as const;

const FLUXOS = ["visita", "despesas"];
const CARTOES = ["Cartão Pessoal", "Cartão Clara", ""];
const NIVEIS: NomeNivelEstresse[] = ["Baixo", "Médio", "Alto", "Crítico"];

/** Erro de estrutura: devolve a mensagem, ou null se está tudo certo. */
type Erro = string | null;

const invalido = (campo: string) => `Dados inválidos em ${campo}.`;

// ── Peças básicas ────────────────────────────────────────────────

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown, campo: string, maximo: number = LIMITES.texto): Erro {
  return typeof valor === "string" && valor.length <= maximo ? null : invalido(campo);
}

/** "" (não informado) ou uma data que existe no calendário. */
export function dataValida(valor: string): boolean {
  if (valor === "") return true;
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function data(valor: unknown, campo: string): Erro {
  return typeof valor === "string" && dataValida(valor) ? null : invalido(campo);
}

function numero(valor: unknown, campo: string, minimo: number, maximo: number): Erro {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= minimo && valor <= maximo
    ? null
    : invalido(campo);
}

function lista(valor: unknown, campo: string, maximo: number): Erro {
  return Array.isArray(valor) && valor.length <= maximo ? null : invalido(campo);
}

function listaDeTextos(valor: unknown, campo: string): Erro {
  return (
    lista(valor, campo, LIMITES.itensPorLista) ??
    primeiroErro((valor as unknown[]).map((item, i) => texto(item, `${campo}[${i}]`)))
  );
}

function primeiroErro(erros: Erro[]): Erro {
  return erros.find((erro) => erro !== null) ?? null;
}

/** Confere cada item de uma lista com a função do bloco. */
function cadaItem(
  valor: unknown,
  campo: string,
  maximo: number,
  conferir: (item: unknown, campo: string) => Erro,
): Erro {
  const erroLista = lista(valor, campo, maximo);
  if (erroLista) return erroLista;
  for (const [i, item] of (valor as unknown[]).entries()) {
    const erro = conferir(item, `${campo}[${i}]`);
    if (erro) return erro;
  }
  return null;
}

// ── Blocos do DiaSalvo ───────────────────────────────────────────

function conferirIdentificacao(valor: unknown): Erro {
  if (!ehObjeto(valor)) return invalido("identificacao");
  return texto(valor.nome, "identificacao.nome") ?? texto(valor.email, "identificacao.email");
}

function conferirAgenciaVisitada(valor: unknown, campo: string): Erro {
  if (!ehObjeto(valor)) return invalido(campo);
  return texto(valor.id, `${campo}.id`) ?? texto(valor.nome, `${campo}.nome`);
}

function conferirVisita(valor: unknown): Erro {
  if (!ehObjeto(valor)) return invalido("visita");
  return (
    data(valor.data, "visita.data") ??
    cadaItem(valor.agencias, "visita.agencias", LIMITES.agencias, conferirAgenciaVisitada)
  );
}

function conferirEstresse(valor: unknown, campo: string): Erro {
  if (!ehObjeto(valor)) return invalido(campo);
  if (!NIVEIS.includes(valor.nivel as NomeNivelEstresse)) return invalido(`${campo}.nivel`);
  return (
    texto(valor.id, `${campo}.id`) ??
    listaDeTextos(valor.setores, `${campo}.setores`) ??
    texto(valor.descricao, `${campo}.descricao`, LIMITES.textoLongo)
  );
}

function conferirAcao(valor: unknown, campo: string): Erro {
  if (!ehObjeto(valor)) return invalido(campo);
  return (
    texto(valor.setor, `${campo}.setor`) ??
    texto(valor.detalhe, `${campo}.detalhe`, LIMITES.textoLongo)
  );
}

function conferirEndereco(valor: unknown, campo: string): Erro {
  if (!ehObjeto(valor)) return invalido(campo);
  const campos = ["cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"];
  return primeiroErro(campos.map((nome) => texto(valor[nome], `${campo}.${nome}`)));
}

function conferirAgenciaComercial(valor: unknown, campo: string): Erro {
  if (!ehObjeto(valor)) return invalido(campo);
  return (
    texto(valor.id, `${campo}.id`) ??
    texto(valor.nome, `${campo}.nome`) ??
    data(valor.dataFundacao, `${campo}.dataFundacao`) ??
    texto(valor.faturamentoAnual, `${campo}.faturamentoAnual`) ??
    texto(valor.faturamentoAnualLabel, `${campo}.faturamentoAnualLabel`) ??
    conferirEndereco(valor.endereco, `${campo}.endereco`) ??
    listaDeTextos(valor.produtos, `${campo}.produtos`) ??
    listaDeTextos(valor.atendentes, `${campo}.atendentes`) ??
    cadaItem(valor.estresses, `${campo}.estresses`, LIMITES.estressesPorAgencia, conferirEstresse) ??
    cadaItem(valor.acoes, `${campo}.acoes`, LIMITES.acoesPorAgencia, conferirAcao)
  );
}

function conferirTrajeto(valor: unknown, campo: string): Erro {
  if (!ehObjeto(valor)) return invalido(campo);
  return (
    texto(valor.id, `${campo}.id`) ??
    data(valor.data, `${campo}.data`) ??
    texto(valor.partida, `${campo}.partida`) ??
    texto(valor.destino, `${campo}.destino`) ??
    numero(valor.km, `${campo}.km`, 0, LIMITES.kmMaximo) ??
    // O reembolso do navegador é ignorado (o servidor recalcula), mas
    // ainda precisa ser um número para o corpo ser um DiaSalvo.
    numero(valor.reembolsoKm, `${campo}.reembolsoKm`, -Infinity, Infinity)
  );
}

function conferirDespesa(valor: unknown, campo: string): Erro {
  if (!ehObjeto(valor)) return invalido(campo);
  if (!CARTOES.includes(valor.cartao as string)) return invalido(`${campo}.cartao`);
  return (
    texto(valor.id, `${campo}.id`) ??
    data(valor.data, `${campo}.data`) ??
    texto(valor.categoria, `${campo}.categoria`) ??
    numero(valor.valor, `${campo}.valor`, 0, LIMITES.valorMaximo) ??
    texto(valor.nomeArquivo, `${campo}.nomeArquivo`)
  );
}

function conferirFluxos(valor: unknown): Erro {
  if (!Array.isArray(valor) || valor.length === 0) return invalido("fluxos");
  const unicos = new Set(valor);
  const todosConhecidos = valor.every((fluxo) => FLUXOS.includes(fluxo as string));
  return todosConhecidos && unicos.size === valor.length ? null : invalido("fluxos");
}

function conferirEstrutura(corpo: unknown): Erro {
  if (!ehObjeto(corpo)) return "O corpo precisa ser um relatório (objeto JSON).";
  if (!Number.isSafeInteger(corpo.id) || (corpo.id as number) <= 0) return invalido("id");
  return (
    texto(corpo.salvadoEm, "salvadoEm") ??
    conferirFluxos(corpo.fluxos) ??
    conferirIdentificacao(corpo.identificacao) ??
    conferirVisita(corpo.visita) ??
    cadaItem(corpo.agenciasVisitadas, "agenciasVisitadas", LIMITES.agencias, texto) ??
    cadaItem(corpo.agenciasComercial, "agenciasComercial", LIMITES.agencias, conferirAgenciaComercial) ??
    cadaItem(corpo.trajetos, "trajetos", LIMITES.trajetos, conferirTrajeto) ??
    cadaItem(corpo.despesas, "despesas", LIMITES.despesas, conferirDespesa)
  );
}

// ── Regras de negócio (as da tela) ───────────────────────────────

function conferirRegras(dia: DiaSalvo): Erro {
  const resultados = [
    validarIdentificacao(dia.identificacao),
    dia.fluxos.includes("visita") ? validarVisita(dia.visita) : null,
    dia.fluxos.includes("despesas") ? validarDespesas(dia.trajetos, dia.despesas) : null,
    validarSalvarDia({ trajetos: dia.trajetos, agenciasVisitadas: dia.agenciasVisitadas }),
    ...dia.agenciasComercial.flatMap((agencia) =>
      agencia.estresses.map((estresse) => validarRegistroEstresse(estresse)),
    ),
  ];
  return resultados.find((resultado) => resultado && !resultado.valido)?.erro ?? null;
}

export function validarDiaSalvo(corpo: unknown): ResultadoValidacaoDia {
  const erroEstrutura = conferirEstrutura(corpo);
  if (erroEstrutura) return { ok: false, erro: erroEstrutura };

  const dia = corpo as DiaSalvo;
  const erroRegra = conferirRegras(dia);
  if (erroRegra) return { ok: false, erro: erroRegra };

  return { ok: true, dia };
}
