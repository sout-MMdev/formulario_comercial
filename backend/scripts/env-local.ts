// ================================================================
// ARQUIVOS .env.local DOS APPS
// O front lê VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
// (packages/nucleo/src/config/app.ts). Com eles, usa o back-end;
// sem eles, entra no modo demonstração.
// Os .env.local ficam fora do git (.gitignore: .env.*).
// ================================================================

import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Pastas dos dois apps, relativas à raiz do repositório. */
export const APPS = ["apps/desktop", "apps/mobile"] as const;

export function montarEnvLocal(url: string, chavePublica: string): string {
  return `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${chavePublica}\n`;
}

/** Escreve o .env.local nos dois apps; devolve os caminhos escritos. */
export function conectarApps(raiz: string, url: string, chavePublica: string): string[] {
  return APPS.map((app) => {
    const caminho = join(app, ".env.local");
    writeFileSync(join(raiz, caminho), montarEnvLocal(url, chavePublica), "utf8");
    return caminho;
  });
}

/** Apaga o .env.local dos dois apps (os apps voltam ao modo demonstração). */
export function desconectarApps(raiz: string): void {
  for (const app of APPS) {
    rmSync(join(raiz, app, ".env.local"), { force: true });
  }
}
