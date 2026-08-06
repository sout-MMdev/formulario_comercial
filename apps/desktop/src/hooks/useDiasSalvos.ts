// ================================================================
// HOOK — useDiasSalvos
// Lê e mantém sincronizada a lista de dias já salvos.
// Conversa apenas com o repositório: se ele virar API, este hook
// continua igual.
// ================================================================

import { useCallback, useEffect, useState } from "react";
import { repositorioDias } from "@cativa/nucleo/servicos/armazenamento";
import type { DiaSalvo } from "@cativa/nucleo/tipos";

export function useDiasSalvos() {
  const [dias, setDias] = useState<DiaSalvo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    const lista = await repositorioDias.listar();
    setDias(lista);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const excluir = useCallback(async (id: number) => {
    const lista = await repositorioDias.excluir(id);
    setDias(lista);
  }, []);

  const limparTudo = useCallback(async () => {
    await repositorioDias.limpar();
    setDias([]);
  }, []);

  return { dias, carregando, recarregar, excluir, limparTudo };
}
