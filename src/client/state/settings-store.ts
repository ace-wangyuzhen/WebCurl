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
  prettyByDefault: false,
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
