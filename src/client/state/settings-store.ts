import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Settings {
  // Request execution defaults, applied to every request that is sent.
  defaultTimeoutMs: number;
  followRedirects: boolean;
  maxRedirects: number;
  // Response display preferences.
  prettyByDefault: boolean;
  wrapLines: boolean;
  // Bodies larger than this are rendered truncated; copy still uses the full body.
  maxRenderBytes: number;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  defaultTimeoutMs: 30_000,
  followRedirects: true,
  maxRedirects: 5,
  prettyByDefault: true,
  wrapLines: true,
  maxRenderBytes: 2 * 1024 * 1024,
};

interface SettingsState extends Settings {
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const SETTINGS_STORAGE_KEY = "web-curl-settings";

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (patch) => set(patch),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      // v1 makes formatted responses the default. Older installs persisted the
      // previous `false`, so upgrade them once instead of leaving them stuck.
      version: 1,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<Settings>;
        if (version < 1) {
          return { ...state, prettyByDefault: true } as Settings;
        }
        return state as Settings;
      },
      // Only persist the settings values, not the action functions.
      partialize: (state) => ({
        defaultTimeoutMs: state.defaultTimeoutMs,
        followRedirects: state.followRedirects,
        maxRedirects: state.maxRedirects,
        prettyByDefault: state.prettyByDefault,
        wrapLines: state.wrapLines,
        maxRenderBytes: state.maxRenderBytes,
      }),
    },
  ),
);
