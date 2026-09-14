import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Divider,
  Drawer,
  Input,
  InputNumber,
  Modal,
  Switch,
  Typography,
  message,
} from "antd";
import { db } from "../db/database";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  useSettingsStore,
} from "../state/settings-store";

const EDITOR_STORAGE_KEY = "web-curl-editor-selection";
const RESET_CONFIRM_WORD = "DELETE";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { t } = useTranslation();
  const defaultTimeoutMs = useSettingsStore((s) => s.defaultTimeoutMs);
  const followRedirects = useSettingsStore((s) => s.followRedirects);
  const maxRedirects = useSettingsStore((s) => s.maxRedirects);
  const prettyByDefault = useSettingsStore((s) => s.prettyByDefault);
  const wrapLines = useSettingsStore((s) => s.wrapLines);
  const maxRenderBytes = useSettingsStore((s) => s.maxRenderBytes);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [resetOpen, setResetOpen] = useState(false);
  const [confirmWord, setConfirmWord] = useState("");
  const [usage, setUsage] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const estimate = await navigator.storage?.estimate?.();
        if (!cancelled) {
          setUsage(estimate ? estimate.usage ?? 0 : null);
        }
      } catch {
        if (!cancelled) {
          setUsage(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const openReset = useCallback(() => {
    setConfirmWord("");
    setResetOpen(true);
  }, []);

  const handleReset = useCallback(async () => {
    await Promise.all([
      db.collections.clear(),
      db.folders.clear(),
      db.requests.clear(),
      db.environments.clear(),
      db.history.clear(),
    ]);
    try {
      localStorage.removeItem(EDITOR_STORAGE_KEY);
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; clearing the tables above still applies.
    }
    useEditorStore.getState().clearSelection();
    void message.success(t("settings.resetDone"));
    window.location.reload();
  }, [t]);

  return (
    <Drawer
      title={t("toolbar.settings")}
      placement="right"
      open={open}
      onClose={onClose}
    >
      <section className="settings-section">
        <Typography.Title level={5}>
          {t("settings.section.request")}
        </Typography.Title>
        <div className="settings-row">
          <span className="settings-label">{t("settings.timeout")}</span>
          <InputNumber
            min={1}
            max={300_000}
            step={1000}
            value={defaultTimeoutMs}
            aria-label={t("settings.timeout")}
            onChange={(value) =>
              updateSettings({
                defaultTimeoutMs: value ?? DEFAULT_SETTINGS.defaultTimeoutMs,
              })
            }
          />
        </div>
        <div className="settings-row">
          <span className="settings-label">{t("settings.followRedirects")}</span>
          <Switch
            checked={followRedirects}
            aria-label={t("settings.followRedirects")}
            onChange={(checked) => updateSettings({ followRedirects: checked })}
          />
        </div>
        <div className="settings-row">
          <span className="settings-label">{t("settings.maxRedirects")}</span>
          <InputNumber
            min={0}
            max={50}
            value={maxRedirects}
            aria-label={t("settings.maxRedirects")}
            onChange={(value) =>
              updateSettings({
                maxRedirects: value ?? DEFAULT_SETTINGS.maxRedirects,
              })
            }
          />
        </div>
      </section>

      <Divider />

      <section className="settings-section">
        <Typography.Title level={5}>
          {t("settings.section.response")}
        </Typography.Title>
        <div className="settings-row">
          <span className="settings-label">{t("settings.prettyByDefault")}</span>
          <Switch
            checked={prettyByDefault}
            aria-label={t("settings.prettyByDefault")}
            onChange={(checked) => updateSettings({ prettyByDefault: checked })}
          />
        </div>
        <div className="settings-row">
          <span className="settings-label">{t("settings.wrapLines")}</span>
          <Switch
            checked={wrapLines}
            aria-label={t("settings.wrapLines")}
            onChange={(checked) => updateSettings({ wrapLines: checked })}
          />
        </div>
        <div className="settings-row">
          <span className="settings-label">{t("settings.maxRenderBytes")}</span>
          <InputNumber
            min={1}
            max={51_200}
            step={256}
            value={Math.round(maxRenderBytes / 1024)}
            aria-label={t("settings.maxRenderBytes")}
            onChange={(value) =>
              updateSettings({
                maxRenderBytes:
                  (value ?? Math.round(DEFAULT_SETTINGS.maxRenderBytes / 1024)) *
                  1024,
              })
            }
          />
        </div>
      </section>

      <Divider />

      <section className="settings-section settings-danger">
        <Typography.Title level={5}>
          {t("settings.section.data")}
        </Typography.Title>
        <div className="settings-row">
          <span className="settings-label">{t("settings.storageUsage")}</span>
          <Typography.Text type="secondary">
            {usage === null ? t("settings.storageUnknown") : formatBytes(usage)}
          </Typography.Text>
        </div>
        <Button danger block onClick={openReset}>
          {t("settings.reset")}
        </Button>
      </section>

      <Modal
        title={t("settings.resetTitle")}
        open={resetOpen}
        onOk={() => void handleReset()}
        onCancel={() => {
          setResetOpen(false);
          setConfirmWord("");
        }}
        okText={t("settings.reset")}
        okButtonProps={{
          danger: true,
          disabled: confirmWord !== RESET_CONFIRM_WORD,
        }}
      >
        <Typography.Paragraph>{t("settings.resetDesc")}</Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          {t("settings.resetConfirmHint", { word: RESET_CONFIRM_WORD })}
        </Typography.Paragraph>
        <Input
          value={confirmWord}
          onChange={(event) => setConfirmWord(event.target.value)}
          placeholder={RESET_CONFIRM_WORD}
          aria-label={t("settings.resetConfirmAria")}
          autoFocus
        />
      </Modal>
    </Drawer>
  );
}
