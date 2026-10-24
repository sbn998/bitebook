import { getLocales } from "expo-localization";
import Storage from "expo-sqlite/kv-store";
import { createContext, type ReactNode, useContext, useState } from "react";

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

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: Strings;
}>({ language: "en", setLanguage: () => {}, t: en });

// Wraps the app so every screen can read the texts in the current language. Changing the language
// redraws every screen that uses them, right away.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(startingLanguage);

  function setLanguage(next: Language) {
    Storage.setItemSync(STORAGE_KEY, next);
    setLanguageState(next);
  }

  return <LanguageContext value={{ language, setLanguage, t: STRINGS[language] }}>{children}</LanguageContext>;
}

// `t` holds the texts in the current language, e.g. t.common.save.
export function useTranslation() {
  return useContext(LanguageContext);
}
