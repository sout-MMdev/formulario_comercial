import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

const raizMonorepo = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // ---- PWA: torna o app instalável no celular + funciona offline ----
    VitePWA({
      // Atualiza sozinho quando sai uma versão nova (sem app preso no antigo)
      registerType: "autoUpdate",
      injectRegister: "auto",
      // Já temos public/manifest.webmanifest + as meta tags no index.html
      manifest: false,
      includeAssets: [
        "manifest.webmanifest",
        "apple-touch-icon.png",
        "icone-192.png",
        "icone-512.png",
        "icone-maskable-512.png",
      ],
      workbox: {
        // Casca do app: cacheada para abrir rápido e funcionar offline
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,ico,woff2}"],
        navigateFallback: "/index.html",
        // Navegações para a futura API não caem no index.html
        navigateFallbackDenylist: [/^\/api/],
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // BACK-END futuro: SEMPRE tenta a rede primeiro (dados frescos);
            // só usa cache como reserva quando estiver offline.
            // Ajuste o padrão para a URL real da API quando ela existir.
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fontes do Google: cache longo (offline + carregamento rápido)
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" ||
              url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Service worker só no build de produção (evita cache atrapalhando o dev)
      devOptions: { enabled: false },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@cativa/nucleo": fileURLToPath(
        new URL("../../packages/nucleo/src", import.meta.url),
      ),
      "@cativa/tema": fileURLToPath(
        new URL("../../packages/tema/src", import.meta.url),
      ),
    },
  },

  publicDir: "public",

  server: {
    // Porta diferente do desktop: dá para rodar os dois ao mesmo tempo
    port: 5502,
    open: true,
    // host: true expõe na rede local — é assim que se abre o app no
    // celular durante o desenvolvimento (http://<ip-do-pc>:5502)
    host: true,
    fs: {
      allow: [raizMonorepo],
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
