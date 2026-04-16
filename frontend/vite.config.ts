import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig(() => {
  return {
    plugins: [preact()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/ws": {
          target: "ws://localhost:8000",
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
