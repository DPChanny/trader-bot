import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig(() => {
  return {
    plugins: [tanstackRouter(), react()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        "/ws": {
          target: "ws://127.0.0.1:8000",
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
