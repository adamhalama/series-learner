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

const sampleNoDefaultTitle: TitleItem = {
  _id: "title_2" as Id<"titles">,
  name: "No Default Yet",
  contentType: "series",
  languageCode: "da",
  defaultUnitMinutes: null,
  totalUnits: 0,
  totalMinutes: 0,
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
        onQuickLog={onQuickLog}
        onCreateTitle={vi.fn().mockResolvedValue(undefined)}
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

  it("requires minutes before first log when no default exists", async () => {
    const user = userEvent.setup();
    const onQuickLog = vi.fn().mockResolvedValue(undefined);

    render(
      <TitleBoard
        titles={[sampleNoDefaultTitle]}
        languages={[{ code: "da", label: "Danish" }]}
        onQuickLog={onQuickLog}
        onCreateTitle={vi.fn().mockResolvedValue(undefined)}
        onDeleteTitle={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const logButton = screen.getByRole("button", { name: /Set \+ Log/i });
    expect(logButton).toBeDisabled();

    const minutesInput = screen.getByLabelText(/No Default Yet minutes/i);
    await user.type(minutesInput, "32");

    expect(screen.getByRole("button", { name: /Set \+ Log/i })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /Set \+ Log/i }));

    await waitFor(() => {
      expect(onQuickLog).toHaveBeenCalledWith(sampleNoDefaultTitle, 32);
    });
  });

  it("creates title from inline language row", async () => {
    const user = userEvent.setup();
    const onCreateTitle = vi.fn().mockResolvedValue(undefined);

    render(
      <TitleBoard
        titles={[]}
        languages={[{ code: "da", label: "Danish" }]}
        onQuickLog={vi.fn().mockResolvedValue(undefined)}
        onCreateTitle={onCreateTitle}
        onDeleteTitle={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /^Add$/i })[0]);

    const newTitleInput = screen.getByPlaceholderText(/New series title/i);
    await user.type(newTitleInput, "Borgen");

    await user.click(screen.getByRole("button", { name: /Create/i }));

    await waitFor(() => {
      expect(onCreateTitle).toHaveBeenCalledWith({
        name: "Borgen",
        contentType: "series",
        languageCode: "da",
        languageLabel: "Danish",
      });
    });
  });

  it("calls onDeleteTitle after confirmation", async () => {
    const user = userEvent.setup();
    const onDeleteTitle = vi.fn().mockResolvedValue(undefined);

    render(
      <TitleBoard
        titles={[sampleTitle]}
        languages={[{ code: "da", label: "Danish" }]}
        onQuickLog={vi.fn().mockResolvedValue(undefined)}
        onCreateTitle={vi.fn().mockResolvedValue(undefined)}
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
