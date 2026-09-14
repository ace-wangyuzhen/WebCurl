import { Button, Select, Tooltip, Typography } from "antd";
import {
  DownloadOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UploadOutlined,
} from "@ant-design/icons";
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
          <Button icon={<UploadOutlined />} aria-label="Import workspace" />
        </Tooltip>
        <Tooltip title="Export workspace">
          <Button icon={<DownloadOutlined />} aria-label="Export workspace" />
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
    </header>
  );
}
