"use client";

import { useUIStore } from "@/stores/ui.store";
import { fr } from "date-fns/locale/fr";
import { enUS } from "date-fns/locale/en-US";

const DATE_LOCALES = { fr, en: enUS } as const;
const INTL_LOCALES = { fr: "fr-FR", en: "en-US" } as const;

export function useLocaleDate() {
  const locale = useUIStore((s) => s.locale);
  return {
    dateLocale: DATE_LOCALES[locale],
    intlLocale: INTL_LOCALES[locale],
  };
}
