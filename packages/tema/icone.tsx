// ================================================================
// ÍCONE (compartilhado — desktop + mobile)
// Fonte ÚNICA dos ícones dos formulários. Cada nome do app aponta
// para o ícone de linha equivalente do Flowbite (outline); os nomes
// ainda sem mapa caem no traçado do @cativa/tema (icones.ts).
// Herdam a cor do texto (currentColor); traço 1.8 casa os estilos.
//
// Ícone novo: mapeie aqui para o Flowbite, ou adicione o traçado em
// icones.ts (fallback). Vale para os dois apps de uma vez.
// ================================================================

import type { CSSProperties } from "react";
import { trilhasIcone, type NomeIcone } from "./icones";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  CalendarMonth,
  CameraPhoto,
  ChartMixed,
  Check,
  CheckCircle,
  ChevronDown,
  Close,
  Envelope,
  ExclamationCircle,
  FileLines,
  FloppyDisk,
  InfoCircle,
  MapPin,
  PaperClip,
  Plus,
  TrashBin,
  User,
  Wallet,
} from "flowbite-react-icons/outline";

// Nome do app → componente Flowbite. Todos compartilham a mesma
// assinatura, então `typeof Plus` serve de tipo.
type IconeFlowbite = typeof Plus;
const FLOWBITE: Partial<Record<NomeIcone, IconeFlowbite>> = {
  carteira: Wallet,
  informacao: InfoCircle,
  alerta: ExclamationCircle,
  sucesso: CheckCircle,
  predio: Building,
  calendario: CalendarMonth,
  seta_baixo: ChevronDown,
  seta_esquerda: ArrowLeft,
  seta_direita: ArrowRight,
  camera: CameraPhoto,
  clipe: PaperClip,
  fechar: Close,
  checar: Check,
  email: Envelope,
  grafico: ChartMixed,
  lixeira: TrashBin,
  mais: Plus,
  salvar: FloppyDisk,
  mapa: MapPin,
  documento: FileLines,
  usuario: User,
  // carro, alvo e termometro seguem no traçado do @cativa/tema (fallback)
};

// Alinhamento igual ao antigo `.icone` do desktop — inline, sem
// depender de CSS externo (o componente é portátil entre os apps).
const ESTILO: CSSProperties = {
  display: "inline-block",
  flexShrink: 0,
  verticalAlign: "middle",
};

export interface PropsIcone {
  nome: NomeIcone;
  /** Lado do quadrado, em pixels. */
  tamanho?: number;
  /** Espessura do traço. */
  traco?: number;
  className?: string;
}

export function Icone({
  nome,
  tamanho = 18,
  traco = 1.8,
  className = "",
}: PropsIcone) {
  const classe = ["icone", className].filter(Boolean).join(" ");
  const Flowbite = FLOWBITE[nome];

  if (Flowbite) {
    return (
      <Flowbite
        size={tamanho}
        strokeWidth={traco}
        className={classe}
        style={ESTILO}
        aria-hidden="true"
        focusable="false"
      />
    );
  }

  // Fallback: traçado do tema (nomes ainda não mapeados)
  return (
    <svg
      className={classe}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={ESTILO}
      aria-hidden="true"
      focusable="false"
    >
      <path d={trilhasIcone[nome]} />
    </svg>
  );
}

export type { NomeIcone };
