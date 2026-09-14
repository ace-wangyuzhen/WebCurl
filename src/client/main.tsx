import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { seedWorkspaceIfEmpty } from "./db/seed";
import "./app.css";
import "./styles/tokens.css";

try {
  await seedWorkspaceIfEmpty();
} catch {
  // Seeding is best-effort; the app still renders with an empty workspace.
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
