"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

type AppProvidersProps = {
  children: ReactNode;
};

const LOCAL_CONVEX_URL = "http://127.0.0.1:3210";

export const AppProviders = ({ children }: AppProvidersProps) => {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || LOCAL_CONVEX_URL;
    return new ConvexReactClient(url);
  }, []);

  return (
    <ConvexProvider client={client}>
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
    </ConvexProvider>
  );
};
