import { theme as antdTheme } from "antd";
import type { ThemeConfig } from "antd";

export type ThemeMode = "light" | "dark";

const FONT_SANS =
  'Inter, "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FONT_MONO =
  '"JetBrains Mono", "SF Mono", SFMono-Regular, ui-monospace, "Cascadia Code", Consolas, "Liberation Mono", Menlo, monospace';

const ACCENT = "#4f46e5";

const light: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: ACCENT,
    colorInfo: ACCENT,
    colorLink: "#4f46e5",
    colorSuccess: "#0f9157",
    colorWarning: "#b96a0b",
    colorError: "#d43b3b",
    colorTextBase: "#171a21",
    colorBgBase: "#ffffff",
    colorBgLayout: "#f4f5f8",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBorder: "#e4e6ec",
    colorBorderSecondary: "#e4e6ec",
    colorText: "#171a21",
    colorTextSecondary: "#5b6270",
    colorTextTertiary: "#8b92a0",
    colorTextQuaternary: "#a6adba",
    fontFamily: FONT_SANS,
    fontFamilyCode: FONT_MONO,
    borderRadius: 8,
    controlHeight: 36,
    controlOutline: "rgba(79, 70, 229, 0.16)",
    colorLinkHover: "#4338ca",
  },
  components: {
    Button: {
      fontWeight: 500,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
    },
    Tabs: {
      inkBarColor: "#4f46e5",
      itemSelectedColor: "#171a21",
      itemHoverColor: "#171a21",
      itemColor: "#5b6270",
      titleFontSize: 13,
    },
    Table: {
      headerBg: "#f2f4f7",
      headerColor: "#5b6270",
      headerSplitColor: "transparent",
      borderColor: "#e4e6ec",
      rowHoverBg: "#f6f7fa",
      cellPaddingBlock: 8,
      cellPaddingInline: 12,
    },
    Tree: {
      nodeSelectedBg: "rgba(79, 70, 229, 0.1)",
      nodeHoverBg: "#f2f4f7",
      titleHeight: 28,
    },
  },
};

const dark: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: ACCENT,
    colorInfo: ACCENT,
    colorLink: "#a5b4fc",
    colorSuccess: "#34d399",
    colorWarning: "#fbbf24",
    colorError: "#f87171",
    colorTextBase: "#e7eaf0",
    colorBgBase: "#161b23",
    colorBgLayout: "#0f1218",
    colorBgContainer: "#161b23",
    colorBgElevated: "#1d232e",
    colorBorder: "#262d38",
    colorBorderSecondary: "#262d38",
    colorText: "#e7eaf0",
    colorTextSecondary: "#9aa4b2",
    colorTextTertiary: "#66707f",
    colorTextQuaternary: "#4a5463",
    fontFamily: FONT_SANS,
    fontFamilyCode: FONT_MONO,
    borderRadius: 8,
    controlHeight: 36,
    controlOutline: "rgba(129, 140, 248, 0.2)",
    colorLinkHover: "#c7d2fe",
  },
  components: {
    Button: {
      fontWeight: 500,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
    },
    Tabs: {
      inkBarColor: "#a5b4fc",
      itemSelectedColor: "#e7eaf0",
      itemHoverColor: "#e7eaf0",
      itemColor: "#9aa4b2",
      titleFontSize: 13,
    },
    Table: {
      headerBg: "#1c222c",
      headerColor: "#9aa4b2",
      headerSplitColor: "transparent",
      borderColor: "#262d38",
      rowHoverBg: "#1c222c",
      cellPaddingBlock: 8,
      cellPaddingInline: 12,
    },
    Tree: {
      nodeSelectedBg: "rgba(129, 140, 248, 0.16)",
      nodeHoverBg: "#1c222c",
      titleHeight: 28,
    },
  },
};

export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  return mode === "dark" ? dark : light;
}
