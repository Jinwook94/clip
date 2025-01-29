import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

/**
 * ESM 환경에서는 __dirname, __filename 을 기본적으로 제공하지 않음
 * 따라서 import.meta.url 을 이용해 "현재 파일의 URL"을 얻은 뒤,
 * fileURLToPath 로 이를 실제 파일 경로로 변환하여 __dirname 을 대체 구현
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 절대경로 별칭을 @ → ./src 로 설정
    },
  },
  esbuild: { target: "esnext" },
  test: {
    root: __dirname,
    include: ["test/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    testTimeout: 1000 * 29,
  },
});
