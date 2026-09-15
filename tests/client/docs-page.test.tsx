import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/client/App";

it("opens the docs page from the toolbar and returns to the request view", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /documentation/i }));

  expect(
    screen.getByRole("heading", { level: 1, name: /documentation/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /building a request/i }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /back/i }));
  expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
});
