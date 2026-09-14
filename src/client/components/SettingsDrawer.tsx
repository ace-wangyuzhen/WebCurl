import { Drawer, Typography } from "antd";
import { useTranslation } from "../i18n";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer
      title={t("toolbar.settings")}
      placement="right"
      open={open}
      onClose={onClose}
    >
      <Typography.Paragraph>{t("settings.placeholder")}</Typography.Paragraph>
    </Drawer>
  );
}
