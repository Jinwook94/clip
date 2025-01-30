import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  /**
   * server 옵션은 반드시 ServerOptions 혹은 undefined 이어야 함.
   * 아래 로직을 통해, process.env.VSCODE_DEBUG 가 truthy 면 { host, port },
   * 아니라면 undefined 로 처리.
   */
  let server = undefined;
  if (process.env.VSCODE_DEBUG) {
    const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
    server = {
      host: url.hostname,
      port: Number(url.port),
    };
  }

  return {
    resolve: {
      alias: {
        "@": path.join(__dirname, "src"),
      },
    },
    plugins: [
      react(),
      electron({
        main: {
          entry: "electron/main/index.ts",
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log("[startup] Electron App (Debug Mode)");
            } else {
              args.startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
              },
            },
          },
        },
        preload: {
          input: "electron/preload/index.ts",
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined, // #332
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
              },
            },
          },
        },
        renderer: {},
      }),
    ],

    /**
     * server: ServerOptions | undefined
     * - 위에서 정의한 server 변수를 사용
     */
    server,

    clearScreen: false,
  };
});
