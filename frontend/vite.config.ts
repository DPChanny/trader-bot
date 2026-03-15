import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const API_HOST = env.VITE_API_HOST || "localhost";
  const API_PORT = env.VITE_API_PORT || "8000";

  const API_TARGET = `http://${API_HOST}:${API_PORT}`;
  const WS_TARGET = `ws://${API_HOST}:${API_PORT}`;

  return {
    plugins: [preact(), tsconfigPaths()],
    server: {
      proxy: {
        "/api": {
          target: API_TARGET,
          changeOrigin: true,
          // 필요시: rewrite: (path) => path.replace(/^\/api/, ''),
        },
        "/ws": {
          target: WS_TARGET,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
