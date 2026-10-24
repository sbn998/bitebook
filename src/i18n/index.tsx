import { getLocales } from "expo-localization";
import Storage from "expo-sqlite/kv-store";
import { createContext, type ReactNode, useContext, useState } from "react";

import type { Unit } from "@/constants/food";
import { en, type Strings } from "@/i18n/en";
import { es } from "@/i18n/es";

export type Language = "en" | "es";
export type { Strings };

const STRINGS: Record<Language, Strings> = { en, es };

// The language the user picked in Settings, kept apart from the food data.
const STORAGE_KEY = "language";

// The saved choice if there is one; otherwise Spanish if the phone is in Spanish, and English for anything else.
function startingLanguage(): Language {
  const saved = Storage.getItemSync(STORAGE_KEY);
  if (saved === "en" || saved === "es") return saved;
  return getLocales()[0]?.languageCode === "es" ? "es" : "en";
}

// The locale used to format dates and numbers, so they match the app's language. If the phone is in the
// same language, its own regional format is kept (e.g. "en-GB" writes 24/10/2026); otherwise a default.
function dateLocale(language: Language) {
  const phone = getLocales()[0];
  if (phone?.languageCode === language && phone.languageTag) return phone.languageTag;
  return language === "es" ? "es-ES" : "en-US";
}

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: Strings;
  locale: string;
}>({ language: "en", setLanguage: () => {}, t: en, locale: "en-US" });

// Wraps the app so every screen can read the texts in the current language. Changing the language
// redraws every screen that uses them, right away.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(startingLanguage);

  function setLanguage(next: Language) {
    Storage.setItemSync(STORAGE_KEY, next);
    setLanguageState(next);
  }

  return (
    <LanguageContext value={{ language, setLanguage, t: STRINGS[language], locale: dateLocale(language) }}>
      {children}
    </LanguageContext>
  );
}

// `t` holds the texts in the current language, e.g. t.common.save; `locale` formats dates and numbers.
export function useTranslation() {
  return useContext(LanguageContext);
}

// A unit's name for an amount: singular for exactly 1, plural otherwise ("1 slice", "2 slices", "0.5 slices").
export function unitName(t: Strings, unit: Unit, amount: number) {
  return amount === 1 ? t.units[unit].one : t.units[unit].other;
}
