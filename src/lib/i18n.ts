"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";

const resources = {
  en: { translation: translations.en },
  hi: { translation: translations.hi },
  gu: { translation: translations.gu }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", 
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
