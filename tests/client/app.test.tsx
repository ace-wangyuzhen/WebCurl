import { render, screen } from "@testing-library/react";
import { App } from "../../src/client/App";

it("renders the request workspace shell", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Web Curl" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
});
