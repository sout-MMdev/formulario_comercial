// ================================================================
// SELETOR DE DATA (mobile)
// Abre uma folha com calendário de dias grandes (44px+) e atalhos
// para "Hoje" e "Ontem" — que é a data usada em 9 de cada 10
// preenchimentos, feitos no fim do dia ou na manhã seguinte.
//
// O valor continua sendo "YYYY-MM-DD", igual ao desktop.
// ================================================================

import { useEffect, useMemo, useState } from "react";
import { Botao } from "./Botao";
import { Icone } from "./Icone";
import { Folha } from "./Folha";
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
  valor: string;
  aoAlterar: (valorIso: string) => void;
  placeholder?: string;
  invalido?: boolean;
}

export function SeletorData({
  id,
  valor,
  aoAlterar,
  placeholder = "Escolher data",
  invalido = false,
}: PropsSeletorData) {
  const hoje = useMemo(() => new Date(), []);
  const [aberta, setAberta] = useState(false);

  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [dia, setDia] = useState<number | null>(null);

  useEffect(() => {
    if (!aberta) return;

    if (valor) {
      const [a, m, d] = valor.split("-").map(Number);
      setAno(a);
      setMes(m);
      setDia(d);
    } else {
      setAno(hoje.getFullYear());
      setMes(hoje.getMonth() + 1);
      setDia(null);
    }
  }, [aberta, valor, hoje]);

  const anos = useMemo(() => {
    const lista: number[] = [];
    for (
      let a = hoje.getFullYear() + DATA_ANOS_PARA_FRENTE;
      a >= hoje.getFullYear() - DATA_ANOS_PARA_TRAS;
      a--
    ) {
      lista.push(a);
    }
    return lista;
  }, [hoje]);

  const celulas = useMemo(() => {
    const total = diasNoMes(mes, ano);
    const inicio = new Date(ano, mes - 1, 1).getDay();
    const lista: (number | null)[] = Array(inicio).fill(null);
    for (let d = 1; d <= total; d++) lista.push(d);
    return lista;
  }, [mes, ano]);

  function mudarMes(passo: number) {
    let m = mes + passo;
    let a = ano;
    if (m < 1) {
      m = 12;
      a -= 1;
    } else if (m > 12) {
      m = 1;
      a += 1;
    }
    setMes(m);
    setAno(a);
  }

  /** Atalho: grava a data e fecha em um toque só. */
  function escolherRapido(deslocamentoDias: number) {
    const data = new Date();
    data.setDate(data.getDate() + deslocamentoDias);
    aoAlterar(
      montarDataIso(data.getDate(), data.getMonth() + 1, data.getFullYear()),
    );
    setAberta(false);
  }

  function confirmar() {
    if (!dia) return;
    aoAlterar(montarDataIso(dia, mes, ano));
    setAberta(false);
  }

  const ehHoje = (d: number) =>
    d === hoje.getDate() &&
    mes === hoje.getMonth() + 1 &&
    ano === hoje.getFullYear();

  return (
    <>
      <button
        id={id}
        type="button"
        className={[
          "data-campo",
          valor ? "data-campo--preenchido" : "",
          invalido ? "data-campo--invalido" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setAberta(true)}
      >
        <Icone nome="calendario" tamanho={20} className="data-campo__icone" />
        <span className="data-campo__texto">
          {valor ? formatarData(valor) : placeholder}
        </span>
        <Icone nome="seta_baixo" tamanho={18} className="data-campo__seta" />
      </button>

      <Folha
        aberta={aberta}
        etiqueta="Calendário"
        titulo="Escolha a data"
        aoFechar={() => setAberta(false)}
        rodape={
          <>
            <Botao variante="contorno" onClick={() => setAberta(false)}>
              Cancelar
            </Botao>
            <Botao variante="primario" onClick={confirmar} disabled={!dia}>
              Confirmar
            </Botao>
          </>
        }
      >
        {/* Atalhos — cobrem a grande maioria dos casos */}
        <div className="data-atalhos">
          <button
            type="button"
            className="data-atalho"
            onClick={() => escolherRapido(0)}
          >
            Hoje
          </button>
          <button
            type="button"
            className="data-atalho"
            onClick={() => escolherRapido(-1)}
          >
            Ontem
          </button>
          <button
            type="button"
            className="data-atalho"
            onClick={() => escolherRapido(-2)}
          >
            Anteontem
          </button>
        </div>

        <div className="calendario">
          <div className="calendario__navegacao">
            <button
              type="button"
              className="calendario__passo"
              onClick={() => mudarMes(-1)}
              aria-label="Mês anterior"
            >
              <Icone nome="seta_esquerda" tamanho={18} />
            </button>

            <div className="calendario__seletores">
              <select
                className="calendario__select"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                aria-label="Mês"
              >
                {NOMES_MESES.map((nome, i) => (
                  <option key={nome} value={i + 1}>
                    {nome}
                  </option>
                ))}
              </select>

              <select
                className="calendario__select"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
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
              <Icone nome="seta_direita" tamanho={18} />
            </button>
          </div>

          <div className="calendario__semana">
            {DIAS_SEMANA_CURTOS.map((nome) => (
              <span key={nome} className="calendario__dia-semana">
                {nome.charAt(0)}
              </span>
            ))}
          </div>

          <div className="calendario__grade">
            {celulas.map((d, i) =>
              d === null ? (
                <span key={`vago-${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  className={[
                    "calendario__dia",
                    d === dia ? "calendario__dia--escolhido" : "",
                    ehHoje(d) ? "calendario__dia--hoje" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setDia(d)}
                >
                  {d}
                </button>
              ),
            )}
          </div>
        </div>
      </Folha>
    </>
  );
}
