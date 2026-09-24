import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deployed at https://sethideepika.github.io/Experimentation/polymarket-insights/
// In dev, Polymarket's APIs (polymarket.com Gamma, polymarket.us API/gateway) are proxied through Vite so the browser never
// hits CORS; the production build calls them directly (see src/lib/api.js).
export default defineConfig({
  base: "/Experimentation/polymarket-insights/",
  plugins: [react()],
  server: {
    proxy: {
      "/gamma": {
        target: "https://gamma-api.polymarket.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/gamma/, ""),
      },
      "/pmus-api": {
        target: "https://api.polymarket.us",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/pmus-api/, ""),
      },
      "/pmus-gateway": {
        target: "https://gateway.polymarket.us",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/pmus-gateway/, ""),
      },
    },
  },
});
