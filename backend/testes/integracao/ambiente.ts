// ================================================================
// AMBIENTE LOCAL — endereços e chaves do Supabase que está rodando
// Lê `supabase status -o json`, então nenhuma chave fica escrita no
// código. Os valores nunca são impressos.
// ================================================================

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export interface AmbienteLocal {
  /** Gateway da API (ex.: http://127.0.0.1:54321). */
  url: string;
  /** Chave pública (publishable): a mesma que o navegador usa. */
  chavePublica: string;
  /** Chave de serviço (secret): só para os testes conferirem o banco. */
  chaveServico: string;
  /** Caixa de e-mail de teste (Mailpit). */
  urlMailpit: string;
}

const RAIZ_DO_REPO = fileURLToPath(new URL("../../../", import.meta.url));

export function lerAmbienteLocal(): AmbienteLocal {
  let saida: string;
  try {
    saida = execSync("npx -y supabase@2.122.0 status -o json --workdir backend", {
      cwd: RAIZ_DO_REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error("Supabase local parado. Rode `npm run backend:iniciar` antes dos testes.");
  }

  const status = JSON.parse(saida) as Record<string, string>;
  return {
    url: status.API_URL,
    chavePublica: status.PUBLISHABLE_KEY,
    chaveServico: status.SECRET_KEY,
    urlMailpit: status.MAILPIT_URL,
  };
}
