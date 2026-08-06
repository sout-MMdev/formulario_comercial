// ================================================================
// HOOK — useDiasSalvos
// Lê a lista de dias já salvos. Fala só com o repositório do
// núcleo: se ele virar API do CRM, este hook não muda.
// ================================================================

import { useCallback, useEffect, useState } from "react";
import { repositorioDias } from "@cativa/nucleo/servicos/armazenamento";
import type { DiaSalvo } from "@cativa/nucleo/tipos";

export function useDiasSalvos() {
  const [dias, setDias] = useState<DiaSalvo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setDias(await repositorioDias.listar());
    setCarregando(false);
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const excluir = useCallback(async (id: number) => {
    setDias(await repositorioDias.excluir(id));
  }, []);

  return { dias, carregando, recarregar, excluir };
}
