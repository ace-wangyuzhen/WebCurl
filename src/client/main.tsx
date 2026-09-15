import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ensureDefaultEnvironments } from "./db/seed";
import "./app.css";
import "./styles/tokens.css";

try {
  // No demo data is seeded; the workspace starts empty and the user creates
  // their own collections. This only backfills default environments for any
  // collection that lacks them (e.g. imported data).
  await ensureDefaultEnvironments();
} catch {
  // Best-effort; the app still renders with an empty workspace.
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
