// ================================================================
// CAMPOS BÁSICOS (mobile)
//
// Detalhes que só importam no celular e estão embutidos aqui:
//   • fonte 16px nos controles (evita o zoom automático do iOS);
//   • inputMode/enterKeyHint corretos para o teclado virtual abrir
//     já no formato certo — numérico para KM, decimal para valor,
//     e-mail para e-mail;
//   • autoCapitalize desligado onde atrapalha.
// ================================================================

import { useId, type ReactNode } from "react";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Icone } from "./Icone";

// ── Envelope ─────────────────────────────────────────────────────

interface PropsCampo {
  rotulo?: string;
  obrigatorio?: boolean;
  ajuda?: string;
  erro?: string | null;
  children: (id: string) => ReactNode;
}

export function Campo({
  rotulo,
  obrigatorio = false,
  ajuda,
  erro,
  children,
}: PropsCampo) {
  const id = useId();

  return (
    <div className="campo">
      {rotulo && (
        <label className="campo__rotulo" htmlFor={id}>
          {rotulo}
          {obrigatorio && <span className="campo__obrigatorio">*</span>}
        </label>
      )}

      {children(id)}

      {erro ? (
        <span className="campo__erro" role="alert">
          <Icone nome="alerta" tamanho={14} />
          {erro}
        </span>
      ) : (
        ajuda && <span className="campo__ajuda">{ajuda}</span>
      )}
    </div>
  );
}

// ── input ────────────────────────────────────────────────────────

interface PropsEntrada extends InputHTMLAttributes<HTMLInputElement> {
  invalido?: boolean;
  calculado?: boolean;
}

export function Entrada({
  invalido = false,
  calculado = false,
  className = "",
  ...resto
}: PropsEntrada) {
  return (
    <input
      className={[
        "controle",
        invalido ? "controle--invalido" : "",
        calculado ? "controle--calculado" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...resto}
    />
  );
}

// ── textarea ─────────────────────────────────────────────────────

interface PropsAreaTexto extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalido?: boolean;
}

export function AreaTexto({
  invalido = false,
  className = "",
  rows = 4,
  ...resto
}: PropsAreaTexto) {
  return (
    <textarea
      className={["controle", invalido ? "controle--invalido" : "", className]
        .filter(Boolean)
        .join(" ")}
      rows={rows}
      {...resto}
    />
  );
}

// ── select ───────────────────────────────────────────────────────

interface PropsSelecao extends SelectHTMLAttributes<HTMLSelectElement> {
  invalido?: boolean;
  placeholder?: string;
  opcoes: { valor: string; rotulo: string }[];
}

export function Selecao({
  invalido = false,
  placeholder = "Selecione...",
  opcoes,
  className = "",
  ...resto
}: PropsSelecao) {
  return (
    <select
      className={["controle", invalido ? "controle--invalido" : "", className]
        .filter(Boolean)
        .join(" ")}
      {...resto}
    >
      <option value="">{placeholder}</option>
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </option>
      ))}
    </select>
  );
}

// ── quilometragem ────────────────────────────────────────────────

interface PropsEntradaKm {
  id?: string;
  valor: number;
  aoAlterar: (valor: number) => void;
}

export function EntradaKm({ id, valor, aoAlterar }: PropsEntradaKm) {
  return (
    <Entrada
      id={id}
      type="number"
      // inputMode numeric abre o teclado numérico direto no celular
      inputMode="numeric"
      enterKeyHint="done"
      min="0"
      placeholder="Ex.: 45"
      value={valor ? String(valor) : ""}
      onChange={(evento) => {
        const numero = parseFloat(evento.target.value);
        aoAlterar(Number.isNaN(numero) ? 0 : numero);
      }}
    />
  );
}

// ── valor em reais ───────────────────────────────────────────────

interface PropsEntradaMoeda {
  id?: string;
  valor: number;
  aoAlterar?: (valor: number) => void;
  calculado?: boolean;
  somenteLeitura?: boolean;
}

export function EntradaMoeda({
  id,
  valor,
  aoAlterar,
  calculado = false,
  somenteLeitura = false,
}: PropsEntradaMoeda) {
  return (
    <div className="controle-moeda">
      <span className="controle-moeda__prefixo">R$</span>
      <Entrada
        id={id}
        type="number"
        // decimal traz a vírgula no teclado do celular
        inputMode="decimal"
        enterKeyHint="done"
        step="0.01"
        min="0"
        placeholder="0,00"
        calculado={calculado}
        readOnly={somenteLeitura}
        tabIndex={somenteLeitura ? -1 : undefined}
        value={valor ? String(valor) : ""}
        onChange={(evento) => {
          const numero = parseFloat(evento.target.value);
          aoAlterar?.(Number.isNaN(numero) ? 0 : numero);
        }}
      />
    </div>
  );
}
