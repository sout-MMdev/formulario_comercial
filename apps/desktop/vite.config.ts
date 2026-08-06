import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const raizMonorepo = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // "@/..." aponta para src/ deste app
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Aponta para o SOURCE do núcleo: alterar uma regra recarrega
      // a tela na hora, sem precisar recompilar o pacote.
      "@cativa/nucleo": fileURLToPath(
        new URL("../../packages/nucleo/src", import.meta.url),
      ),
      // Tokens visuais compartilhados com o app mobile
      "@cativa/tema": fileURLToPath(
        new URL("../../packages/tema", import.meta.url),
      ),
    },
  },

  // Arquivos estáticos servidos direto (agencias.json, imagens)
  publicDir: "public",

  server: {
    port: 5501,
    open: true,
    host: true,
    fs: {
      // Libera a leitura de packages/, que está fora da raiz deste app
      allow: [raizMonorepo],
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
