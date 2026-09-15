import { useCallback, useState } from "react";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { AppShell } from "./components/AppShell";
import { useLanguageStore } from "./i18n";
import { buildAntdTheme, type ThemeMode } from "./theme";

export function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const language = useLanguageStore((state) => state.language);

  const toggleTheme = useCallback(() => {
    setThemeMode((current) => {
      const next = current === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const openDocs = useCallback(() => setDocsOpen(true), []);
  const closeDocs = useCallback(() => setDocsOpen(false), []);

  return (
    <ConfigProvider
      locale={language === "zh" ? zhCN : enUS}
      theme={buildAntdTheme(themeMode)}
    >
      <AppShell
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onOpenSettings={openSettings}
        settingsOpen={settingsOpen}
        onCloseSettings={closeSettings}
        docsOpen={docsOpen}
        onOpenDocs={openDocs}
        onCloseDocs={closeDocs}
      />
    </ConfigProvider>
  );
}
