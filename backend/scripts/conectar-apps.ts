// ================================================================
// LIGAR OS APPS AO BACK-END LOCAL
//
//   npm run backend:conectar-apps      → apps usam o Supabase local
//   npm run backend:desconectar-apps   → apps voltam ao modo demonstração
//
// Nunca imprime as chaves: só os caminhos dos arquivos e a URL local.
// ================================================================

import { lerAmbienteLocal, RAIZ_DO_REPO } from "./ambiente-local.ts";
import { conectarApps, desconectarApps } from "./env-local.ts";

if (process.argv.includes("--remover")) {
  desconectarApps(RAIZ_DO_REPO);
  console.log("Apps desligados do back-end: voltaram ao modo demonstração.");
} else {
  const ambiente = lerAmbienteLocal();
  const escritos = conectarApps(RAIZ_DO_REPO, ambiente.url, ambiente.chavePublica);
  console.log(`Apps ligados ao back-end local (${ambiente.url}):`);
  for (const caminho of escritos) console.log(`  - ${caminho}`);
  console.log("Reinicie o `npm run dev:desktop` / `dev:mobile` se já estiverem abertos.");
}
