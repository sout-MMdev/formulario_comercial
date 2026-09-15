// ================================================================
// ÍCONE (mobile) — mapeia cada nome do app para o ícone equivalente
// do Bootstrap Icons (react-bootstrap-icons). Herdam a cor do texto
// (fill="currentColor" é o padrão do pacote). Tamanho padrão 20px,
// maior que o do desktop (18px) por causa do toque.
//
// Ícone novo: acrescente o nome em icones.ts e mapeie aqui embaixo.
// O mapa é um Record completo, então o TypeScript reclama se faltar.
//
// Este Icone é SÓ do mobile — o desktop tem o seu. Dá pra
// estilizar/dimensionar um sem tocar no outro.
//
// Nota: o Bootstrap desenha com `fill` (contorno embutido no path),
// não com `stroke`. Por isso não há prop de espessura — o peso do
// traço vem pronto do desenho; pra ícones mais encorpados, aumente
// o `tamanho`.
// ================================================================

import type { CSSProperties } from "react";
import { type NomeIcone } from "./icones";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Bullseye,
  Calendar3,
  Camera,
  CarFront,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Envelope,
  ExclamationCircle,
  Eye,
  EyeSlash,
  FileEarmarkText,
  Floppy,
  GeoAlt,
  GraphUp,
  InfoCircle,
  Key,
  List,
  Paperclip,
  Pencil,
  Person,
  Plus,
  ThermometerHalf,
  Trash,
  Wallet2,
  X,
  type Icon as IconeBootstrap,
} from "react-bootstrap-icons";

// Nome do app → componente do Bootstrap Icons.
const BOOTSTRAP: Record<NomeIcone, IconeBootstrap> = {
  // Navegação
  seta_direita: ArrowRight,
  seta_esquerda: ArrowLeft,
  seta_baixo: ChevronDown,
  seta_cima: ChevronUp,

  // Ações
  mais: Plus,
  fechar: X,
  checar: Check,
  lixeira: Trash,
  editar: Pencil,
  olho: Eye,
  olho_fechado: EyeSlash,

  // Objetos
  calendario: Calendar3,
  carro: CarFront,
  predio: Building,
  carteira: Wallet2,
  clipe: Paperclip,
  documento: FileEarmarkText,
  usuario: Person,
  email: Envelope,
  mapa: GeoAlt,
  termometro: ThermometerHalf,
  alvo: Bullseye,
  grafico: GraphUp,
  camera: Camera,
  lista: List,
  chave: Key,

  // Sinalização
  informacao: InfoCircle,
  alerta: ExclamationCircle,
  sucesso: CheckCircle,
  salvar: Floppy,
};

// Alinhamento inline — o componente não depende de CSS externo.
const ESTILO: CSSProperties = {
  display: "inline-block",
  flexShrink: 0,
  verticalAlign: "middle",
};

export interface PropsIcone {
  nome: NomeIcone;
  /** Lado do quadrado, em pixels. */
  tamanho?: number;
  className?: string;
}

export function Icone({ nome, tamanho = 20, className = "" }: PropsIcone) {
  const Desenho = BOOTSTRAP[nome];

  return (
    <Desenho
      size={tamanho}
      className={["icone", className].filter(Boolean).join(" ")}
      style={ESTILO}
      aria-hidden="true"
      focusable="false"
    />
  );
}

export type { NomeIcone };
