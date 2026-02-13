"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { HtmlLangSetter } from "@/components/html-lang-setter";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>
        <HtmlLangSetter />
        {children}
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </SessionProvider>
  );
}
