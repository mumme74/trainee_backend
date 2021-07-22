import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

export const availableLanguages = [
  { code: "en", name: "English", country_code: "gb" },
  { code: "sv", name: "Svenska", country_code: "se" },
];

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpApi)
  .init({
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",
    interpolation: { escapeValue: false },
  });

export default i18next;
