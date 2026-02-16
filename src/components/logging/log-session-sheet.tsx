"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TitleItem } from "@/lib/types";
import { logSessionFormSchema } from "@/lib/validators";

type LogSessionPayload = {
  titleId: Id<"titles">;
  units: number;
  unitMinutes: number;
};

type LogSessionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTitle: TitleItem | null;
  onSubmit: (payload: LogSessionPayload) => Promise<void>;
};

export const LogSessionSheet = ({
  open,
  onOpenChange,
  selectedTitle,
  onSubmit,
}: LogSessionSheetProps) => {
  const form = useForm({
    resolver: zodResolver(logSessionFormSchema),
    defaultValues: {
      units: 1,
      unitMinutes: selectedTitle?.defaultUnitMinutes ?? undefined,
    },
  });

  useEffect(() => {
    form.reset({
      units: 1,
      unitMinutes: selectedTitle?.defaultUnitMinutes ?? undefined,
    });
  }, [selectedTitle, form]);

  const handleSubmit = form.handleSubmit(async (rawValues) => {
    const values = logSessionFormSchema.parse(rawValues);
    if (!selectedTitle) {
      return;
    }

    try {
      await onSubmit({
        titleId: selectedTitle._id,
        units: values.units,
        unitMinutes: values.unitMinutes,
      });

      form.reset({
        units: 1,
        unitMinutes: selectedTitle.defaultUnitMinutes ?? undefined,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error(`Could not log session: ${(error as Error).message}`);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88svh] rounded-t-3xl border-[var(--color-panel-border)] bg-[var(--color-surface)]"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-2xl tracking-wide">
            Log Session
          </SheetTitle>
          <SheetDescription className="text-[var(--color-text-muted)]">
            {selectedTitle
              ? `${selectedTitle.name} • ${selectedTitle.languageCode}`
              : "Select a title before logging."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <Form {...form}>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormField
                control={form.control}
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Episodes/Viewings</FormLabel>
                    <FormControl>
                      <Input
                        value={
                          typeof field.value === "number" ||
                          typeof field.value === "string"
                            ? field.value
                            : ""
                        }
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        inputMode="numeric"
                        className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minutes per unit</FormLabel>
                    <FormControl>
                      <Input
                        value={
                          typeof field.value === "number" ||
                          typeof field.value === "string"
                            ? field.value
                            : ""
                        }
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        inputMode="numeric"
                        placeholder={selectedTitle?.defaultUnitMinutes?.toString() || "30"}
                        className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-xl border border-[var(--color-panel-border)] bg-[var(--color-surface-soft)] p-3 text-sm text-[var(--color-text-muted)]">
                <p className="flex items-center gap-2">
                  <Clock3 className="size-4 text-[var(--color-signal)]" />
                  First log requires minutes. Later logs auto-fill your last used value.
                </p>
              </div>

              <SheetFooter className="px-0">
                <Button
                  type="submit"
                  className="min-h-11 w-full"
                  disabled={!selectedTitle || form.formState.isSubmitting}
                >
                  <Plus className="size-4" />
                  Add watch session
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
