import { useRef } from "react";
import { Button, Select, Tooltip, Typography, message } from "antd";
import {
  DownloadOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { exportWorkspace, importWorkspace } from "../db/seed";
import { useEditorStore } from "../state/editor-store";
import type { ThemeMode } from "../App";

interface TopToolbarProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export function TopToolbar({
  themeMode,
  onToggleTheme,
  onOpenSettings,
}: TopToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const data = await exportWorkspace();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "web-curl-workspace.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);
      if (
        window.confirm(
          "Importing will replace the current workspace. Continue?",
        )
      ) {
        await importWorkspace(data);
        useEditorStore.getState().bumpWorkspaceVersion();
        void message.success("Workspace imported");
      }
    } catch {
      void message.error("Import failed: invalid workspace file");
    }
  };

  return (
    <header className="top-toolbar">
      <Typography.Title level={3} className="top-toolbar-title">
        Web Curl
      </Typography.Title>

      <div className="top-toolbar-actions">
        <Select
          className="environment-select"
          placeholder="No environment"
          options={[]}
          value={null}
          aria-label="Active environment"
        />
        <Tooltip title="Import workspace">
          <Button
            icon={<UploadOutlined />}
            aria-label="Import workspace"
            onClick={() => fileInputRef.current?.click()}
          />
        </Tooltip>
        <Tooltip title="Export workspace">
          <Button
            icon={<DownloadOutlined />}
            aria-label="Export workspace"
            onClick={() => void handleExport()}
          />
        </Tooltip>
        <Tooltip title="Settings">
          <Button
            icon={<SettingOutlined />}
            aria-label="Open settings"
            onClick={onOpenSettings}
          />
        </Tooltip>
        <Tooltip
          title={
            themeMode === "dark"
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
        >
          <Button
            icon={themeMode === "dark" ? <SunOutlined /> : <MoonOutlined />}
            aria-label="Toggle theme"
            onClick={onToggleTheme}
          />
        </Tooltip>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        aria-label="Import workspace file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          void handleImport(file);
          event.target.value = "";
        }}
      />
    </header>
  );
}
