import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { TopToolbar } from "./TopToolbar";
import { CollectionSidebar } from "./CollectionSidebar";
import { RequestWorkspace } from "./RequestWorkspace";
import { SettingsDrawer } from "./SettingsDrawer";
import { DocsPage } from "./DocsPage";
import { useTranslation } from "../i18n";
import type { ThemeMode } from "../theme";

interface AppShellProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
  onCloseSettings: () => void;
  docsOpen: boolean;
  onOpenDocs: () => void;
  onCloseDocs: () => void;
}

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 560;
const SIDEBAR_DEFAULT = 264;
const SIDEBAR_STORAGE_KEY = "web-curl-sidebar-width";

function clampWidth(value: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, value));
}

export function AppShell({
  themeMode,
  onToggleTheme,
  onOpenSettings,
  settingsOpen,
  onCloseSettings,
  docsOpen,
  onOpenDocs,
  onCloseDocs,
}: AppShellProps) {
  const { t } = useTranslation();
  const bodyRef = useRef<HTMLDivElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      const parsed = raw ? Number(raw) : NaN;
      return Number.isFinite(parsed) ? clampWidth(parsed) : SIDEBAR_DEFAULT;
    } catch {
      return SIDEBAR_DEFAULT;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
    } catch {
      // Persisting the width is best-effort.
    }
  }, [sidebarWidth]);

  const startResize = useCallback((event: ReactPointerEvent) => {
    event.preventDefault();
    const body = bodyRef.current;
    if (!body) {
      return;
    }
    const left = body.getBoundingClientRect().left;
    document.body.classList.add("is-resizing");

    const onMove = (move: PointerEvent) => {
      setSidebarWidth(clampWidth(move.clientX - left));
    };
    const onUp = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  const nudge = useCallback((event: ReactKeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSidebarWidth((width) => clampWidth(width - 16));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setSidebarWidth((width) => clampWidth(width + 16));
    }
  }, []);

  return (
    <div className="app-shell">
      <TopToolbar
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
        onOpenSettings={onOpenSettings}
        onOpenDocs={onOpenDocs}
      />
      <div
        className="app-body"
        ref={bodyRef}
        style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
      >
        {docsOpen ? (
          <main className="docs-view">
            <DocsPage onBack={onCloseDocs} />
          </main>
        ) : (
          <>
            <CollectionSidebar />
            <div
              className="sidebar-resizer"
              role="separator"
              aria-orientation="vertical"
              aria-label={t("layout.resizeSidebar")}
              aria-valuenow={sidebarWidth}
              aria-valuemin={SIDEBAR_MIN}
              aria-valuemax={SIDEBAR_MAX}
              tabIndex={0}
              onPointerDown={startResize}
              onKeyDown={nudge}
            />
            <main className="request-workspace">
              <RequestWorkspace />
            </main>
          </>
        )}
      </div>
      <SettingsDrawer open={settingsOpen} onClose={onCloseSettings} />
    </div>
  );
}
