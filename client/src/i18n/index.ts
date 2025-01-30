import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ko from "./locales/ko.json";
import zh from "./locales/zh.json";
import zhTW from "./locales/zh-TW.json";
import es from "./locales/es.json";
import ar from "./locales/ar.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import ja from "./locales/ja.json";
import ru from "./locales/ru.json";
import hi from "./locales/hi.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    zh: { translation: zh },
    "zh-TW": { translation: zhTW },
    es: { translation: es },
    ar: { translation: ar },
    de: { translation: de },
    fr: { translation: fr },
    ja: { translation: ja },
    ru: { translation: ru },
    hi: { translation: hi },
  },
  lng: "en", // 초기값
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
