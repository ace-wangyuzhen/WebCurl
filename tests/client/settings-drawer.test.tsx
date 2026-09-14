import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDrawer } from "../../src/client/components/SettingsDrawer";

function disabledCount(name: RegExp): number {
  return screen
    .getAllByRole("button", { name })
    .filter((button) => (button as HTMLButtonElement).disabled).length;
}

it("gates the reset action behind typing the confirmation word", async () => {
  render(<SettingsDrawer open onClose={() => {}} />);

  await userEvent.click(
    screen.getByRole("button", { name: /clear all data/i }),
  );

  // The modal's confirm button starts disabled.
  expect(disabledCount(/clear all data/i)).toBeGreaterThan(0);

  await userEvent.type(
    screen.getByLabelText(/confirmation word/i),
    "DELETE",
  );

  // Typing the exact word enables the confirm button.
  expect(disabledCount(/clear all data/i)).toBe(0);
});
