import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { LogSessionSheet } from "@/components/logging/log-session-sheet";
import type { TitleItem } from "@/lib/types";

const sampleTitle: TitleItem = {
  _id: "title_1" as Id<"titles">,
  name: "The Bridge",
  contentType: "series",
  languageCode: "da",
  defaultUnitMinutes: 30,
  totalUnits: 2,
  totalMinutes: 60,
  archived: false,
  createdAt: 0,
  updatedAt: 0,
};

describe("LogSessionSheet", () => {
  it("submits quick log values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <LogSessionSheet
        open
        onOpenChange={() => undefined}
        selectedTitle={sampleTitle}
        onSubmit={onSubmit}
      />,
    );

    const unitsInput = screen.getByLabelText(/Episodes\/Viewings/i);
    await user.clear(unitsInput);
    await user.type(unitsInput, "2");

    const minutesInput = screen.getByLabelText(/Minutes per unit/i);
    await user.clear(minutesInput);
    await user.type(minutesInput, "45");

    await user.click(screen.getByRole("button", { name: /Add watch session/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        titleId: sampleTitle._id,
        units: 2,
        unitMinutes: 45,
      });
    });
  });
});
