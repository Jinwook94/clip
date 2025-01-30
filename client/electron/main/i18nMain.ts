import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "node:path";
import { fileURLToPath } from "node:url";
import store from "./store";

// __dirname 대체 (ESM 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// i18nMain.ts 파일 기준으로, 최종적으로 "src/i18n/locales" 경로를 찾음
// (예시) i18nMain.ts가 client/electron/main/i18nMain.ts 라면, 2~3단계 상위로 이동
const localesPath = path.join(__dirname, "../../..", "src", "i18n", "locales");

i18next
  .use(Backend)
  .init({
    fallbackLng: "en",
    lng: store.get("locale") || "en",
    debug: false,
    backend: {
      loadPath: path.join(localesPath, "{{lng}}.json"),
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    console.log("[i18nMain] init done. current lang=", i18next.language);
  })
  .catch((err) => {
    console.error("[i18nMain] init error:", err);
  });

// 언어 변경
export function changeMainLanguage(lang: string) {
  i18next.changeLanguage(lang).catch(console.error);
}

export default i18next;
