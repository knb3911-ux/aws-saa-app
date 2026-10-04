import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/aws-saa-app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/*", "data/index.json", "data/questions/*.json"],
      manifest: {
        name: "AWS SAA-C03 練習問題",
        short_name: "SAA練習",
        description: "AWS 認定ソリューションアーキテクト – アソシエイト（SAA-C03）のオリジナル練習問題をスマホで解く",
        lang: "ja",
        start_url: "/aws-saa-app/",
        scope: "/aws-saa-app/",
        display: "standalone",
        background_color: "#f6f7f9",
        theme_color: "#ff9900",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json}"],
        globIgnores: ["**/node_modules/**"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "/aws-saa-app/index.html",
      },
    }),
  ],
});
