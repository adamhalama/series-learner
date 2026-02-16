import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LearningLanguageSwitcher } from "@/components/dashboard/learning-language-switcher";

describe("LearningLanguageSwitcher", () => {
  it("calls onChange with the selected language", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LearningLanguageSwitcher
        learningLanguageCode="da"
        languages={[
          { code: "da", label: "Danish" },
          { code: "en", label: "English" },
        ]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "English" }));

    expect(onChange).toHaveBeenCalledWith({ code: "en", label: "English" });
  });
});
