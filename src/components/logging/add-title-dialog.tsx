"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_LANGUAGES } from "@/lib/constants";
import type { ContentType, LanguageOption } from "@/lib/types";
import { addTitleFormSchema } from "@/lib/validators";

type AddTitlePayload = {
  name: string;
  contentType: ContentType;
  languageCode: string;
  languageLabel: string;
  initialUnitMinutes?: number;
};

type AddTitleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddTitlePayload) => Promise<void>;
  languages: LanguageOption[];
};

export const AddTitleDialog = ({
  open,
  onOpenChange,
  onSubmit,
  languages,
}: AddTitleDialogProps) => {
  const languageOptions = useMemo(() => {
    const merged = [...DEFAULT_LANGUAGES, ...languages];
    const uniqueByCode = new Map<string, LanguageOption>();
    for (const language of merged) {
      uniqueByCode.set(language.code, language);
    }
    return [...uniqueByCode.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [languages]);

  const form = useForm({
    resolver: zodResolver(addTitleFormSchema),
    defaultValues: {
      name: "",
      contentType: "series",
      languageMode: "existing",
      languageCode: "da",
      languageLabel: "",
      initialUnitMinutes: "",
    },
  });

  const [languageMode, setLanguageMode] = useState<"existing" | "custom">(
    "existing",
  );

  const handleSubmit = form.handleSubmit(async (rawValues) => {
    const values = addTitleFormSchema.parse(rawValues);

    const selectedLanguage = languageOptions.find(
      (language) => language.code === values.languageCode,
    );

    const languageLabel =
      values.languageMode === "custom"
        ? values.languageLabel?.trim() || values.languageCode.trim().toUpperCase()
        : selectedLanguage?.label || values.languageCode.trim().toUpperCase();

    try {
      await onSubmit({
        name: values.name.trim(),
        contentType: values.contentType,
        languageCode: values.languageCode.trim().toLowerCase(),
        languageLabel,
        initialUnitMinutes:
          values.initialUnitMinutes === "" || values.initialUnitMinutes === undefined
            ? undefined
            : values.initialUnitMinutes,
      });

      form.reset({
        name: "",
        contentType: "series",
        languageMode: "existing",
        languageCode: values.languageCode,
        languageLabel: "",
        initialUnitMinutes: "",
      });
      setLanguageMode("existing");
      onOpenChange(false);
    } catch (error) {
      toast.error(`Could not add title: ${(error as Error).message}`);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          form.reset();
          setLanguageMode("existing");
        }
      }}
    >
      <DialogContent className="sm:max-w-[460px] border-[var(--color-panel-border)] bg-[var(--color-surface)]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wide">
            Add Series or Movie
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-muted)]">
            Create a title in a language group and start tracking episodes or sessions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="The Bridge"
                      className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-11 w-full border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="series">Series</SelectItem>
                        <SelectItem value="movie">Movie</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="languageMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language source</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setLanguageMode(value as "existing" | "custom");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-11 w-full border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="existing">Existing</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {languageMode === "existing" ? (
              <FormField
                control={form.control}
                name="languageCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-11 w-full border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languageOptions.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="languageCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="da"
                          className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languageLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language label</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Danish"
                          className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="initialUnitMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default minutes per episode/viewing (optional)</FormLabel>
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
                      placeholder="45"
                      className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="min-h-11 w-full sm:w-auto">
                <PlusCircle className="size-4" />
                Add title
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
