"use client";

import { useUIStore } from "@/stores/ui.store";
import { fr } from "@/i18n/fr";
import { en } from "@/i18n/en";
import type { Locale, TranslationDictionary } from "@/i18n/types";

const dictionaries: Record<Locale, TranslationDictionary> = { fr, en };

export function useTranslation() {
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const t = dictionaries[locale];

  return { t, locale, setLocale };
}
