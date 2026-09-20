import { defineConfig } from "vite";
const upstream = process.env.GAME_SERVER_HTTP ?? "http://127.0.0.1:2567";
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: ["client"],
    proxy: {
      "/matchmake": upstream,
      "/socket": {
        target: upstream.replace(/^http/, "ws"),
        ws: true,
        rewrite: (p) => p.replace(/^\/socket/, ""),
      },
    },
  },
  build: { target: "es2022" },
});
