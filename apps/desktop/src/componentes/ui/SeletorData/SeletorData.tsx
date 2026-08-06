// ================================================================
// SELETOR DE DATA
// Campo somente-leitura que abre um calendário em pop-up.
// Guarda o valor sempre em "YYYY-MM-DD" e mostra "dd/mm/aaaa".
//
// A navegação tem mês/ano em lista, então alcançar uma data de
// fundação de 1987 leva dois cliques — não 100 rolagens.
// ================================================================

import { useEffect, useMemo, useState } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { Icone } from "@/componentes/ui/Icone";
import { Modal } from "@/componentes/ui/Modal";
import {
  DATA_ANOS_PARA_FRENTE,
  DATA_ANOS_PARA_TRAS,
  DIAS_SEMANA_CURTOS,
  NOMES_MESES,
} from "@cativa/nucleo/config";
import { diasNoMes, formatarData, montarDataIso } from "@cativa/nucleo/utils";
import "./SeletorData.css";

interface PropsSeletorData {
  id?: string;
  valor: string; // "YYYY-MM-DD"
  aoAlterar: (valorIso: string) => void;
  placeholder?: string;
  invalido?: boolean;
  /** Texto do botão que confirma. */
  rotuloConfirmar?: string;
}

export function SeletorData({
  id,
  valor,
  aoAlterar,
  placeholder = "dd/mm/aaaa",
  invalido = false,
  rotuloConfirmar = "Confirmar",
}: PropsSeletorData) {
  const hoje = useMemo(() => new Date(), []);
  const [aberto, setAberto] = useState(false);

  // Estado interno do calendário: mês/ano visíveis + dia escolhido
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [diaEscolhido, setDiaEscolhido] = useState<number | null>(null);

  // Ao abrir, posiciona o calendário no valor já preenchido
  useEffect(() => {
    if (!aberto) return;

    if (valor) {
      const [a, m, d] = valor.split("-").map(Number);
      setAno(a);
      setMes(m);
      setDiaEscolhido(d);
    } else {
      setAno(hoje.getFullYear());
      setMes(hoje.getMonth() + 1);
      setDiaEscolhido(null);
    }
  }, [aberto, valor, hoje]);

  const anos = useMemo(() => {
    const lista: number[] = [];
    const inicio = hoje.getFullYear() + DATA_ANOS_PARA_FRENTE;
    const fim = hoje.getFullYear() - DATA_ANOS_PARA_TRAS;
    for (let a = inicio; a >= fim; a--) lista.push(a);
    return lista;
  }, [hoje]);

  /** Células da grade: nulos no começo para alinhar o dia da semana. */
  const celulas = useMemo(() => {
    const total = diasNoMes(mes, ano);
    const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();
    const lista: (number | null)[] = Array(primeiroDiaSemana).fill(null);
    for (let dia = 1; dia <= total; dia++) lista.push(dia);
    return lista;
  }, [mes, ano]);

  function mudarMes(passo: number) {
    let novoMes = mes + passo;
    let novoAno = ano;

    if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    } else if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    }

    setMes(novoMes);
    setAno(novoAno);
  }

  function confirmar() {
    if (!diaEscolhido) return;
    aoAlterar(montarDataIso(diaEscolhido, mes, ano));
    setAberto(false);
  }

  function escolherHoje() {
    setAno(hoje.getFullYear());
    setMes(hoje.getMonth() + 1);
    setDiaEscolhido(hoje.getDate());
  }

  const ehHoje = (dia: number) =>
    dia === hoje.getDate() &&
    mes === hoje.getMonth() + 1 &&
    ano === hoje.getFullYear();

  return (
    <>
      <button
        id={id}
        type="button"
        className={[
          "seletor-data",
          valor ? "seletor-data--preenchido" : "",
          invalido ? "seletor-data--invalido" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setAberto(true)}
      >
        <Icone nome="calendario" tamanho={16} className="seletor-data__icone" />
        <span className="seletor-data__texto">
          {valor ? formatarData(valor) : placeholder}
        </span>
      </button>

      <Modal
        aberto={aberto}
        etiqueta="Calendário"
        titulo="Selecione a data"
        aoFechar={() => setAberto(false)}
        className="modal--calendario"
        rodape={
          <>
            <Botao variante="discreto" onClick={escolherHoje}>
              Hoje
            </Botao>
            <Botao
              variante="primario"
              onClick={confirmar}
              disabled={!diaEscolhido}
            >
              {rotuloConfirmar}
            </Botao>
          </>
        }
      >
        <div className="calendario">
          {/* ── Navegação: mês anterior, mês, ano, próximo mês ── */}
          <div className="calendario__navegacao">
            <button
              type="button"
              className="calendario__passo"
              onClick={() => mudarMes(-1)}
              aria-label="Mês anterior"
            >
              <Icone nome="seta_esquerda" tamanho={16} />
            </button>

            <div className="calendario__seletores">
              <select
                className="calendario__select"
                value={mes}
                onChange={(evento) => setMes(Number(evento.target.value))}
                aria-label="Mês"
              >
                {NOMES_MESES.map((nome, indice) => (
                  <option key={nome} value={indice + 1}>
                    {nome}
                  </option>
                ))}
              </select>

              <select
                className="calendario__select"
                value={ano}
                onChange={(evento) => setAno(Number(evento.target.value))}
                aria-label="Ano"
              >
                {anos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="calendario__passo"
              onClick={() => mudarMes(1)}
              aria-label="Próximo mês"
            >
              <Icone nome="seta_direita" tamanho={16} />
            </button>
          </div>

          {/* ── Cabeçalho dos dias da semana ─────────────────── */}
          <div className="calendario__semana">
            {DIAS_SEMANA_CURTOS.map((dia) => (
              <span key={dia} className="calendario__dia-semana">
                {dia}
              </span>
            ))}
          </div>

          {/* ── Grade de dias ────────────────────────────────── */}
          <div className="calendario__grade">
            {celulas.map((dia, indice) =>
              dia === null ? (
                <span key={`vazio-${indice}`} className="calendario__vago" />
              ) : (
                <button
                  key={dia}
                  type="button"
                  className={[
                    "calendario__dia",
                    dia === diaEscolhido ? "calendario__dia--escolhido" : "",
                    ehHoje(dia) ? "calendario__dia--hoje" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setDiaEscolhido(dia)}
                  onDoubleClick={() => {
                    setDiaEscolhido(dia);
                    aoAlterar(montarDataIso(dia, mes, ano));
                    setAberto(false);
                  }}
                >
                  {dia}
                </button>
              ),
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
