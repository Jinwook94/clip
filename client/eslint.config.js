import js from "@eslint/js";
import globals from "globals";

import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  // 기본 ESLint 및 파일 무시 설정
  {
    // 검사할 파일(확장자) 및 무시할 폴더
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: ["dist", "dist-electron", "node_modules", "release"],

    // 언어 옵션(파서 설정 등)
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    // 플러그인 등록
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier: prettierPlugin,
      "@typescript-eslint": tsEslintPlugin,
    },

    settings: {
      react: {
        version: "detect", // React 버전 자동 감지
      },
    },

    rules: {
      // ESLint, TS, React, React Hooks 권장 규칙 병합
      ...js.configs.recommended.rules,
      ...tsEslintPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React Refresh 권장 규칙
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TS 규칙 예시
      "@typescript-eslint/ban-ts-comment": "warn",

      // Prettier 위반 시 에러 처리
      "prettier/prettier": "error",

      // React 17+ 부터는 JSX 사용 시 React import 불필요
      "react/react-in-jsx-scope": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          // ^_ 로 시작하는 변수나 파라미터는 미사용이어도 무시
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
