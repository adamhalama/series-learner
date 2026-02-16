"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuickLogFabProps = {
  onClick: () => void;
  disabled?: boolean;
};

export const QuickLogFab = ({ onClick, disabled = false }: QuickLogFabProps) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-panel-border)] bg-[var(--color-surface)]/95 p-3 backdrop-blur md:hidden">
      <Button
        type="button"
        className="min-h-12 w-full rounded-xl"
        onClick={onClick}
        disabled={disabled}
      >
        <Plus className="size-4" />
        Quick Log Session
      </Button>
    </div>
  );
};
