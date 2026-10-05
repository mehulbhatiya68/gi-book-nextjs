"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { translations } from "../translations";

function normalizeLangCode(code: string): "en" | "hi" | "gu" {
  const c = (code || "").toLowerCase().trim();
  if (c === "hi" || c === "hindi" || c.includes("hind")) return "hi";
  if (c === "gu" || c === "gujarati" || c.includes("guj")) return "gu";
  return "en";
}

export function usePreferences() {
  const { t: translateFn, i18n: i18nInstance } = useTranslation();
  const [theme, setThemeState] = useState("system");
  const [language, setLanguageState] = useState<"en" | "hi" | "gu">("en");

  useEffect(() => {
    const savedTheme = Cookies.get("app_theme") || "system";
    const rawLang = Cookies.get("app_language") || localStorage.getItem("app_language") || "en";
    const savedLang = normalizeLangCode(rawLang);

    setThemeState(savedTheme);
    setLanguageState(savedLang);

    const activeI18n = i18nInstance || i18n;
    if (activeI18n.language !== savedLang) {
      activeI18n.changeLanguage(savedLang);
    }
  }, [i18nInstance]);

  useEffect(() => {
    document.documentElement.lang = language;

    const applyTheme = () => {
      let isDark = false;
      if (theme === "dark") {
        isDark = true;
      } else if (theme === "light") {
        isDark = false;
      } else {
        isDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };

    applyTheme();

    if (theme === "system" && typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMediaChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleMediaChange);
      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }
  }, [theme, language]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    Cookies.set("app_theme", newTheme, { expires: 365 });
  };

  const setLanguage = (newLang: string) => {
    const norm = normalizeLangCode(newLang);
    setLanguageState(norm);
    Cookies.set("app_language", norm, { expires: 365, path: "/" });
    try {
      localStorage.setItem("app_language", norm);
    } catch (_) {}

    const activeI18n = i18nInstance || i18n;
    activeI18n.changeLanguage(norm);

    let msg = "Language changed successfully!";
    if (norm === "hi") msg = "भाषा सफलतापूर्वक बदल दी गई!";
    if (norm === "gu") msg = "ભાષા સફળતાપૂર્વક બદલાઈ ગઈ!";

    toast.success(msg, {
      position: "top-right",
      autoClose: 2500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
    });
  };

  const t = (key: string) => {
    if (!key) return "";
    const currentLang = language;
    const langDict = translations[currentLang] as Record<string, string>;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const fallbackDict = translations.en as Record<string, string>;
    if (fallbackDict && fallbackDict[key]) {
      return fallbackDict[key];
    }
    return translateFn(key) || (i18nInstance || i18n).t(key) || key;
  };

  return {
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    i18n: i18nInstance || i18n,
  };
}
