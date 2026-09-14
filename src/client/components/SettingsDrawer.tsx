import { Drawer, Typography } from "antd";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  return (
    <Drawer title="Settings" placement="right" open={open} onClose={onClose}>
      <Typography.Paragraph>
        Resource limits and workspace settings will appear here.
      </Typography.Paragraph>
    </Drawer>
  );
}
