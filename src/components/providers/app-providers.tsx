"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <TooltipProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className:
            "border border-[var(--color-panel-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]",
        }}
      />
    </TooltipProvider>
  );
};
