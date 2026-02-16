import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { TitleBoard } from "@/components/titles/title-board";
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

describe("TitleBoard", () => {
  it("shows confirm state when minutes are changed and logs with edited minutes", async () => {
    const user = userEvent.setup();
    const onQuickLog = vi.fn().mockResolvedValue(undefined);

    render(
      <TitleBoard
        titles={[sampleTitle]}
        languages={[{ code: "da", label: "Danish" }]}
        onAddTitle={() => undefined}
        onQuickLog={onQuickLog}
        onDeleteTitle={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const minutesInput = screen.getByLabelText(/The Bridge minutes/i);
    await user.clear(minutesInput);
    await user.type(minutesInput, "45");

    expect(screen.getByRole("button", { name: /Confirm \+ Log/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirm \+ Log/i }));

    await waitFor(() => {
      expect(onQuickLog).toHaveBeenCalledWith(sampleTitle, 45);
    });
  });

  it("calls onDeleteTitle after confirmation", async () => {
    const user = userEvent.setup();
    const onDeleteTitle = vi.fn().mockResolvedValue(undefined);

    render(
      <TitleBoard
        titles={[sampleTitle]}
        languages={[{ code: "da", label: "Danish" }]}
        onAddTitle={() => undefined}
        onQuickLog={vi.fn().mockResolvedValue(undefined)}
        onDeleteTitle={onDeleteTitle}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Remove/i }));
    await user.click(screen.getByRole("button", { name: /Confirm/i }));

    await waitFor(() => {
      expect(onDeleteTitle).toHaveBeenCalledWith(sampleTitle);
    });
  });
});
