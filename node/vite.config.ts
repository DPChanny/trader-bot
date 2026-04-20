import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig(() => {
  return {
    plugins: [preact()],
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
