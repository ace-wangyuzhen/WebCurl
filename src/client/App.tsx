import { useCallback, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { AppShell } from "./components/AppShell";

export type ThemeMode = "light" | "dark";

export function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    setThemeMode((current) => {
      const next = current === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <ConfigProvider
      theme={{
        algorithm:
          themeMode === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <AppShell
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onOpenSettings={openSettings}
        settingsOpen={settingsOpen}
        onCloseSettings={closeSettings}
      />
    </ConfigProvider>
  );
}
