import { Button, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useTranslation, type MessageKey } from "../i18n";

// Detect Apple platforms so we can show ⌘ instead of Ctrl. Falls back to Ctrl
// everywhere else, including when the API is unavailable.
function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const source = `${navigator.platform} ${navigator.userAgent}`;
  return /Mac|iPhone|iPad|iPod/.test(source);
}

interface ShortcutRow {
  labelKey: MessageKey;
  keys: string[];
}

export function KeyboardShortcutsHint() {
  const { t } = useTranslation();
  const mod = isMacPlatform() ? "⌘" : "Ctrl";

  const shortcuts: ShortcutRow[] = [
    { labelKey: "shortcuts.send", keys: [mod, "Enter"] },
    { labelKey: "shortcuts.save", keys: [mod, "S"] },
    { labelKey: "shortcuts.cancel", keys: ["Esc"] },
  ];

  const content = (
    <ul className="shortcuts-list">
      {shortcuts.map((shortcut) => (
        <li key={shortcut.labelKey} className="shortcuts-row">
          <span className="shortcuts-label">{t(shortcut.labelKey)}</span>
          <span className="shortcuts-keys">
            {shortcut.keys.map((key) => (
              <kbd key={key} className="shortcuts-key">
                {key}
              </kbd>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <Popover
      content={content}
      title={t("shortcuts.title")}
      trigger={["click", "hover"]}
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={<QuestionCircleOutlined />}
        aria-label={t("shortcuts.title")}
      />
    </Popover>
  );
}
