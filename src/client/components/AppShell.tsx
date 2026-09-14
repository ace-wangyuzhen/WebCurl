import { TopToolbar } from "./TopToolbar";
import { CollectionSidebar } from "./CollectionSidebar";
import { RequestWorkspace } from "./RequestWorkspace";
import { SettingsDrawer } from "./SettingsDrawer";
import type { ThemeMode } from "../App";

interface AppShellProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
  onCloseSettings: () => void;
}

export function AppShell({
  themeMode,
  onToggleTheme,
  onOpenSettings,
  settingsOpen,
  onCloseSettings,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <TopToolbar
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
        onOpenSettings={onOpenSettings}
      />
      <div className="app-body">
        <CollectionSidebar />
        <main className="request-workspace">
          <RequestWorkspace />
        </main>
      </div>
      <SettingsDrawer open={settingsOpen} onClose={onCloseSettings} />
    </div>
  );
}
