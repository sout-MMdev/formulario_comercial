import { defineConfig } from "vite";

export default defineConfig({
  // Pasta raiz do código-fonte
  root: ".",

  // Arquivos estáticos (CSS, imagens, splash.html, agencias.json)
  publicDir: "public",

  // Servidor de desenvolvimento (substitui o Live Server)
  server: {
    port: 5501, // mesma porta que você já usava
    open: true, // abre o navegador automaticamente
    host: true, // permite acessar de outros dispositivos na rede
  },

  // Build de produção
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});