import {
  DEFAULT_SETTINGS,
  useSettingsStore,
} from "../../src/client/state/settings-store";

beforeEach(() => {
  useSettingsStore.getState().resetSettings();
});

it("exposes the documented default settings", () => {
  const state = useSettingsStore.getState();
  expect(state.defaultTimeoutMs).toBe(30_000);
  expect(state.followRedirects).toBe(true);
  expect(state.maxRedirects).toBe(5);
  expect(state.prettyByDefault).toBe(true);
  expect(state.wrapLines).toBe(true);
  expect(state.maxRenderBytes).toBe(2 * 1024 * 1024);
});

it("updates individual settings without touching the rest", () => {
  useSettingsStore
    .getState()
    .updateSettings({ maxRedirects: 12, prettyByDefault: true });

  const state = useSettingsStore.getState();
  expect(state.maxRedirects).toBe(12);
  expect(state.prettyByDefault).toBe(true);
  // Untouched values keep their defaults.
  expect(state.defaultTimeoutMs).toBe(DEFAULT_SETTINGS.defaultTimeoutMs);
});

it("restores defaults on reset", () => {
  useSettingsStore.getState().updateSettings({ maxRedirects: 99, wrapLines: false });
  useSettingsStore.getState().resetSettings();

  const state = useSettingsStore.getState();
  expect(state.maxRedirects).toBe(DEFAULT_SETTINGS.maxRedirects);
  expect(state.wrapLines).toBe(DEFAULT_SETTINGS.wrapLines);
});
