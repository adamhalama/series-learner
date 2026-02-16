import { z } from "zod";
import { MAX_UNIT_MINUTES, MIN_UNIT_MINUTES } from "@/lib/constants";

export const addTitleFormSchema = z
  .object({
    name: z.string().trim().min(1, "Title name is required."),
    contentType: z.enum(["series", "movie"]),
    languageMode: z.enum(["existing", "custom"]),
    languageCode: z.string().trim().min(2, "Language code is required."),
    languageLabel: z.string().trim().optional().default(""),
    initialUnitMinutes: z
      .union([z.literal(""), z.coerce.number().int().min(MIN_UNIT_MINUTES).max(MAX_UNIT_MINUTES)])
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.languageMode === "custom" && !value.languageLabel?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Language label is required.",
        path: ["languageLabel"],
      });
    }
  });

export const logSessionFormSchema = z.object({
  units: z.coerce.number().int("Units must be a whole number.").min(1, "Units must be at least 1."),
  unitMinutes: z
    .coerce
    .number()
    .int("Minutes must be a whole number.")
    .min(MIN_UNIT_MINUTES, `Minutes must be at least ${MIN_UNIT_MINUTES}.`)
    .max(MAX_UNIT_MINUTES, `Minutes cannot exceed ${MAX_UNIT_MINUTES}.`),
});

export type AddTitleFormValues = z.infer<typeof addTitleFormSchema>;
export type LogSessionFormValues = z.infer<typeof logSessionFormSchema>;
