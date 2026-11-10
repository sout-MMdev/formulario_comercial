// ================================================================
// MONTAGEM DO RELATÓRIO
// Transforma o DiaSalvo que veio do navegador no payload de
// registrar_relatorio. Duas regras importantes:
//
// 1. Dinheiro é recalculado aqui. O reembolsoKm enviado pelo
//    navegador é ignorado: vale km × tarifa do executivo no banco, e
//    os totais saem de calcularTotaisDia() do núcleo (a mesma conta
//    que a tela mostra).
// 2. Texto vazio vira null, para o banco guardar "não informado" e
//    não uma string vazia.
//
// Arquivo puro: sem APIs do Deno, testado no Node
// (backend/testes/unidade/montagem.teste.ts).
// ================================================================

import { calcularReembolsoComTarifa, calcularTotaisDia } from "./nucleo.ts";
import type { AgenciaComercial, AgenciaVisitada, DiaSalvo, Trajeto } from "./nucleo.ts";
import type {
  AgenciaParaGravar,
  DespesaParaGravar,
  ExecutivoCadastrado,
  RelatorioParaGravar,
  TrajetoParaGravar,
} from "./tipos.ts";

/** "" (ou só espaços) vira null; o resto vai sem espaços nas pontas. */
function textoOuNulo(valor: string | null | undefined): string | null {
  const texto = (valor ?? "").trim();
  return texto === "" ? null : texto;
}

function duasCasas(valor: number): number {
  return Number(valor.toFixed(2));
}

function montarAgencia(
  visitada: AgenciaVisitada,
  comercial: AgenciaComercial | undefined,
): AgenciaParaGravar {
  const endereco = comercial?.endereco;
  return {
    nome: visitada.nome.trim(),
    data_fundacao: textoOuNulo(comercial?.dataFundacao),
    faturamento_anual: textoOuNulo(comercial?.faturamentoAnual),
    faturamento_anual_rotulo: textoOuNulo(comercial?.faturamentoAnualLabel),
    produtos: comercial?.produtos ?? [],
    atendentes: comercial?.atendentes ?? [],
    cep: textoOuNulo(endereco?.cep),
    logradouro: textoOuNulo(endereco?.logradouro),
    numero: textoOuNulo(endereco?.numero),
    complemento: textoOuNulo(endereco?.complemento),
    bairro: textoOuNulo(endereco?.bairro),
    cidade: textoOuNulo(endereco?.cidade),
    uf: textoOuNulo(endereco?.uf),
    estresses: (comercial?.estresses ?? []).map((estresse) => ({
      nivel: estresse.nivel,
      setores: estresse.setores,
      descricao: textoOuNulo(estresse.descricao),
    })),
    acoes: (comercial?.acoes ?? []).map((acao) => ({
      setor: acao.setor.trim(),
      detalhe: acao.detalhe.trim(),
    })),
  };
}

export function montarRelatorio(
  dia: DiaSalvo,
  executivo: ExecutivoCadastrado,
): RelatorioParaGravar {
  // Reembolso refeito com a tarifa do banco (ignora o do navegador).
  const trajetosRecalculados: Trajeto[] = dia.trajetos.map((trajeto) => ({
    ...trajeto,
    reembolsoKm: calcularReembolsoComTarifa(trajeto.km, executivo.tarifaKm),
  }));
  const totais = calcularTotaisDia(trajetosRecalculados, dia.despesas);

  const trajetos: TrajetoParaGravar[] = trajetosRecalculados.map((trajeto) => ({
    data: textoOuNulo(trajeto.data),
    partida: textoOuNulo(trajeto.partida),
    destino: textoOuNulo(trajeto.destino),
    km: trajeto.km || 0,
    tarifa_km: executivo.tarifaKm,
    reembolso: trajeto.reembolsoKm,
  }));

  const despesas: DespesaParaGravar[] = dia.despesas.map((despesa) => ({
    data: textoOuNulo(despesa.data),
    cartao: despesa.cartao === "" ? null : despesa.cartao,
    categoria: textoOuNulo(despesa.categoria),
    valor: despesa.valor || 0,
    nome_comprovante: textoOuNulo(despesa.nomeArquivo),
  }));

  const agencias = dia.visita.agencias
    .filter((agencia) => agencia.nome.trim() !== "")
    .map((agencia) =>
      montarAgencia(
        agencia,
        dia.agenciasComercial.find((comercial) => comercial.id === agencia.id),
      ),
    );

  return {
    executivo_id: executivo.id,
    id_cliente: dia.id,
    fluxos: dia.fluxos,
    data_visita: textoOuNulo(dia.visita.data),
    total_km: duasCasas(totais.totalKm),
    total_pessoal: duasCasas(totais.totalPessoal),
    total_abastecimento_clara: duasCasas(totais.totalAbastecimentoClara),
    total_final: duasCasas(totais.totalFinal),
    km_rodado: duasCasas(totais.kmRodado),
    agencias,
    trajetos,
    despesas,
  };
}
