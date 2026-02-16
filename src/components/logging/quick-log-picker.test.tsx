import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { QuickLogPicker } from "@/components/logging/quick-log-picker";
import type { TitleItem } from "@/lib/types";

const sampleTitles: TitleItem[] = [
  {
    _id: "title_1" as Id<"titles">,
    name: "The Bridge",
    contentType: "series",
    languageCode: "da",
    defaultUnitMinutes: 30,
    totalUnits: 2,
    totalMinutes: 60,
    archived: false,
    createdAt: 0,
    updatedAt: 1,
  },
  {
    _id: "title_2" as Id<"titles">,
    name: "Borgen",
    contentType: "series",
    languageCode: "da",
    defaultUnitMinutes: null,
    totalUnits: 0,
    totalMinutes: 0,
    archived: false,
    createdAt: 0,
    updatedAt: 2,
  },
];

describe("QuickLogPicker", () => {
  it("calls onQuickLog when a series row is clicked", async () => {
    const user = userEvent.setup();
    const onQuickLog = vi.fn().mockResolvedValue(undefined);

    render(
      <QuickLogPicker
        open
        onOpenChange={() => undefined}
        titles={sampleTitles}
        languages={[{ code: "da", label: "Danish" }]}
        onQuickLog={onQuickLog}
      />,
    );

    await user.click(screen.getByRole("button", { name: /The Bridge/i }));

    await waitFor(() => {
      expect(onQuickLog).toHaveBeenCalledWith(sampleTitles[0]);
    });
  });
});
