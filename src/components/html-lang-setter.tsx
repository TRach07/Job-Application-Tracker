"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui.store";

export function HtmlLangSetter() {
  const locale = useUIStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
