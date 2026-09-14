import { TopToolbar } from "./TopToolbar";
import { CollectionSidebar } from "./CollectionSidebar";
import { RequestWorkspace } from "./RequestWorkspace";
import { SettingsDrawer } from "./SettingsDrawer";
import { HistoryDrawer } from "./HistoryDrawer";
import type { ThemeMode } from "../theme";

interface AppShellProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
  onCloseSettings: () => void;
  onOpenHistory: () => void;
  historyOpen: boolean;
  onCloseHistory: () => void;
}

export function AppShell({
  themeMode,
  onToggleTheme,
  onOpenSettings,
  settingsOpen,
  onCloseSettings,
  onOpenHistory,
  historyOpen,
  onCloseHistory,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <TopToolbar
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
        onOpenSettings={onOpenSettings}
        onOpenHistory={onOpenHistory}
      />
      <div className="app-body">
        <CollectionSidebar />
        <main className="request-workspace">
          <RequestWorkspace />
        </main>
      </div>
      <SettingsDrawer open={settingsOpen} onClose={onCloseSettings} />
      <HistoryDrawer open={historyOpen} onClose={onCloseHistory} />
    </div>
  );
}
