// ================================================================
// ENTRADAS BÁSICAS
// input, textarea e select com a aparência padrão do sistema.
// São finos de propósito: toda a aparência mora no CSS
// compartilhado (.controle), então mudar o visual é um lugar só.
// ================================================================

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

// ── input ────────────────────────────────────────────────────────

interface PropsEntrada extends InputHTMLAttributes<HTMLInputElement> {
  invalido?: boolean;
  /** Campo calculado pelo sistema — ganha destaque azul. */
  calculado?: boolean;
}

export function Entrada({
  invalido = false,
  calculado = false,
  className = "",
  ...resto
}: PropsEntrada) {
  const classes = [
    "controle",
    invalido ? "controle--invalido" : "",
    calculado ? "controle--calculado" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input className={classes} {...resto} />;
}

// ── textarea ─────────────────────────────────────────────────────

interface PropsAreaTexto extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalido?: boolean;
}

export function AreaTexto({
  invalido = false,
  className = "",
  rows = 3,
  ...resto
}: PropsAreaTexto) {
  const classes = [
    "controle",
    invalido ? "controle--invalido" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <textarea className={classes} rows={rows} {...resto} />;
}

// ── select ───────────────────────────────────────────────────────

interface PropsSelecao extends SelectHTMLAttributes<HTMLSelectElement> {
  invalido?: boolean;
  /** Primeira opção, desabilitada, funcionando como placeholder. */
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
  const classes = [
    "controle",
    invalido ? "controle--invalido" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <select className={classes} {...resto}>
      <option value="">{placeholder}</option>
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </option>
      ))}
    </select>
  );
}

// ── input de valor em reais ──────────────────────────────────────

interface PropsEntradaMoeda
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value"> {
  valor: number;
  aoAlterar?: (valor: number) => void;
  calculado?: boolean;
  invalido?: boolean;
}

export function EntradaMoeda({
  valor,
  aoAlterar,
  calculado = false,
  invalido = false,
  readOnly,
  ...resto
}: PropsEntradaMoeda) {
  return (
    <div className="controle-moeda">
      <span className="controle-moeda__prefixo">R$</span>
      <Entrada
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0,00"
        calculado={calculado}
        invalido={invalido}
        readOnly={readOnly}
        value={valor ? String(valor) : ""}
        onChange={(evento) => {
          const numero = parseFloat(evento.target.value);
          aoAlterar?.(Number.isNaN(numero) ? 0 : numero);
        }}
        {...resto}
      />
    </div>
  );
}
