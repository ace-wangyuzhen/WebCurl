import { useCallback } from "react";
import { create } from "zustand";

export type Language = "zh" | "en";

const zh = {
  // Top toolbar
  "env.selectCollection": "选择一个集合",
  "env.none": "无环境",
  "env.new": "新建环境",
  "env.rename": "重命名环境",
  "env.delete": "删除环境",
  "env.name": "环境名称",
  "env.newTitle": "新建环境",
  "env.renameTitle": "重命名环境",
  "env.deleteTitle": "删除环境 {name}",
  "env.deleteDesc": "这将永久删除该环境及其变量。",
  "env.create": "创建",
  "common.rename": "重命名",
  "common.delete": "删除",
  "common.cancel": "取消",
  "common.copy": "复制",
  "common.move": "移动",
  "common.copySuffix": "（副本）",
  "toolbar.import": "导入工作区",
  "toolbar.export": "导出工作区",
  "toolbar.settings": "设置",
  "toolbar.theme.toggle": "切换主题",
  "toolbar.theme.toLight": "切换到亮色主题",
  "toolbar.theme.toDark": "切换到暗色主题",
  "toolbar.language": "语言",
  "import.success": "工作区已导入",
  "import.fail": "导入失败：无效的工作区文件",
  "import.confirm": "导入将替换当前工作区。继续？",

  // Collection tree
  "tree.collections": "集合",
  "tree.newCollection": "新建集合",
  "tree.newFolder": "新建文件夹",
  "tree.newRequest": "新建请求",
  "tree.newCollectionName": "新集合",
  "tree.newFolderName": "新文件夹",
  "tree.newRequestName": "新请求",
  "tree.noCollections": "暂无集合",
  "tree.loadError": "加载工作区失败",
  "tree.moveTo": "移动到...",
  "tree.copyTo": "复制到...",
  "tree.renameCollection": "重命名集合",
  "tree.renameFolder": "重命名文件夹",
  "tree.renameRequest": "重命名请求",
  "tree.renameInput": "重命名输入",
  "tree.deleteTitle": "删除 {name}",
  "tree.deleteCollectionDesc": "这将永久删除该集合及其所有文件夹和请求。",
  "tree.deleteFolderDesc": "这将永久删除该文件夹及其所有嵌套文件夹和请求。",
  "tree.deleteRequestDesc": "这将永久删除该请求。",
  "tree.moveTitle": "移动 {name}",
  "tree.copyTitle": "复制 {name}",
  "tree.destination": "选择目标位置",
  "tree.actionsFor": "{name} 的操作",

  // Request toolbar
  "request.method": "HTTP 方法",
  "request.url": "请求 URL",
  "request.urlPlaceholder": "输入请求 URL",
  "request.send": "发送",
  "request.sendAria": "发送请求",
  "request.cancelAria": "取消请求",
  "request.unresolved": "未解析的变量：",
  "request.save": "保存",
  "request.saveAria": "保存请求",
  "request.saved": "请求已保存",

  // Key-value tables
  "table.name": "名称",
  "table.value": "值",
  "table.deleteRow": "删除行",

  // Params / headers editors
  "params.add": "添加参数",
  "params.name": "查询参数名 {n}",
  "params.value": "查询参数值 {n}",
  "params.enable": "启用参数 {n}",
  "headers.add": "添加请求头",
  "headers.name": "请求头名 {n}",
  "headers.value": "请求头值 {n}",
  "headers.enable": "启用请求头 {n}",

  // Body editor
  "body.none": "无",
  "body.text": "文本",
  "body.json": "JSON",
  "body.formUrlencoded": "表单编码",
  "body.content": "正文内容",
  "body.invalidJson": "正文不是有效的 JSON",

  // Script editor
  "script.label": "预请求脚本",
  "script.logs": "脚本日志",

  // Collection / folder editor
  "entity.collection": "集合",
  "entity.folder": "文件夹",
  "entity.preScript": "{kind} 预请求脚本",
  "entity.runsCollection": "在此集合的每个请求之前运行。",
  "entity.runsFolder": "在此文件夹的每个请求之前运行。",

  // Collection variables panel
  "vars.globals": "全局变量",
  "vars.globalsHint": '脚本中通过 pm.globals.get("name") 访问。',
  "vars.environments": "环境",
  "vars.environmentsHint": '脚本中通过 pm.environment.get("name") 访问。',
  "vars.noEnvironments": "暂无环境。请从顶部工具栏添加。",
  "vars.active": "（当前）",
  "vars.add": "添加变量",
  "vars.envName": "环境变量名 {n}",
  "vars.envValue": "环境变量值 {n}",
  "vars.envEnable": "启用环境变量 {n}",
  "vars.globalName": "全局变量名 {n}",
  "vars.globalValue": "全局变量值 {n}",
  "vars.globalEnable": "启用全局变量 {n}",

  // Response panel
  "response.region": "响应",
  "response.empty": "暂无响应",
  "response.noHeaders": "无响应头",
  "response.noBody": "无响应正文",
  "response.copyAria": "复制响应正文",
  "response.pretty": "格式化",
  "response.raw": "原始",
  "curl.copyAria": "复制 curl 命令",

  // History
  "history.title": "历史记录",
  "history.empty": "暂无历史记录",
  "history.clear": "清空",
  "history.clearConfirm": "清空所有历史记录？",
  "history.replayAria": "回放 {url}",

  // Settings drawer
  "settings.placeholder": "资源限制和工作区设置将在这里显示。",
};

const en: Record<keyof typeof zh, string> = {
  "env.selectCollection": "Select a collection",
  "env.none": "No environment",
  "env.new": "New Environment",
  "env.rename": "Rename Environment",
  "env.delete": "Delete Environment",
  "env.name": "Environment name",
  "env.newTitle": "New Environment",
  "env.renameTitle": "Rename Environment",
  "env.deleteTitle": "Delete Environment {name}",
  "env.deleteDesc": "This will permanently delete this environment and its variables.",
  "env.create": "Create",
  "common.rename": "Rename",
  "common.delete": "Delete",
  "common.cancel": "Cancel",
  "common.copy": "Copy",
  "common.move": "Move",
  "common.copySuffix": " (copy)",
  "toolbar.import": "Import workspace",
  "toolbar.export": "Export workspace",
  "toolbar.settings": "Settings",
  "toolbar.theme.toggle": "Toggle theme",
  "toolbar.theme.toLight": "Switch to light theme",
  "toolbar.theme.toDark": "Switch to dark theme",
  "toolbar.language": "Language",
  "import.success": "Workspace imported",
  "import.fail": "Import failed: invalid workspace file",
  "import.confirm": "Importing will replace the current workspace. Continue?",
  "tree.collections": "Collections",
  "tree.newCollection": "New collection",
  "tree.newFolder": "New folder",
  "tree.newRequest": "New request",
  "tree.newCollectionName": "New Collection",
  "tree.newFolderName": "New Folder",
  "tree.newRequestName": "New Request",
  "tree.noCollections": "No collections yet",
  "tree.loadError": "Failed to load workspace",
  "tree.moveTo": "Move to...",
  "tree.copyTo": "Copy to...",
  "tree.renameCollection": "Rename Collection",
  "tree.renameFolder": "Rename Folder",
  "tree.renameRequest": "Rename Request",
  "tree.renameInput": "Rename input",
  "tree.deleteTitle": "Delete {name}",
  "tree.deleteCollectionDesc": "This will permanently delete the collection and all of its folders and requests.",
  "tree.deleteFolderDesc": "This will permanently delete the folder and all of its nested folders and requests.",
  "tree.deleteRequestDesc": "This will permanently delete the request.",
  "tree.moveTitle": "Move {name}",
  "tree.copyTitle": "Copy {name}",
  "tree.destination": "Select destination",
  "tree.actionsFor": "Actions for {name}",
  "request.method": "HTTP method",
  "request.url": "Request URL",
  "request.urlPlaceholder": "Enter request URL",
  "request.send": "Send",
  "request.sendAria": "Send request",
  "request.cancelAria": "Cancel request",
  "request.unresolved": "Unresolved variables:",
  "request.save": "Save",
  "request.saveAria": "Save request",
  "request.saved": "Request saved",
  "table.name": "Name",
  "table.value": "Value",
  "table.deleteRow": "Delete row",
  "params.add": "Add parameter",
  "params.name": "Query parameter name {n}",
  "params.value": "Query parameter value {n}",
  "params.enable": "Enable parameter {n}",
  "headers.add": "Add header",
  "headers.name": "Header name {n}",
  "headers.value": "Header value {n}",
  "headers.enable": "Enable header {n}",
  "body.none": "None",
  "body.text": "Text",
  "body.json": "JSON",
  "body.formUrlencoded": "Form URL Encoded",
  "body.content": "Body content",
  "body.invalidJson": "Body is not valid JSON",
  "script.label": "Pre-request script",
  "script.logs": "Script logs",
  "entity.collection": "Collection",
  "entity.folder": "Folder",
  "entity.preScript": "{kind} Pre-request Script",
  "entity.runsCollection": "Runs before every request in this collection.",
  "entity.runsFolder": "Runs before every request in this folder.",
  "vars.globals": "Globals",
  "vars.globalsHint": 'Available to scripts as pm.globals.get("name").',
  "vars.environments": "Environments",
  "vars.environmentsHint": 'Available to scripts as pm.environment.get("name").',
  "vars.noEnvironments": "No environments yet. Add one from the top toolbar.",
  "vars.active": "(active)",
  "vars.add": "Add variable",
  "vars.envName": "Environment variable name {n}",
  "vars.envValue": "Environment variable value {n}",
  "vars.envEnable": "Enable environment variable {n}",
  "vars.globalName": "Global variable name {n}",
  "vars.globalValue": "Global variable value {n}",
  "vars.globalEnable": "Enable global variable {n}",
  "response.region": "Response",
  "response.empty": "No response yet",
  "response.noHeaders": "No response headers",
  "response.noBody": "No response body",
  "response.copyAria": "Copy response body",
  "response.pretty": "Pretty",
  "response.raw": "Raw",
  "curl.copyAria": "Copy curl command",
  "history.title": "History",
  "history.empty": "No history yet",
  "history.clear": "Clear",
  "history.clearConfirm": "Clear all history?",
  "history.replayAria": "Replay {url}",
  "settings.placeholder": "Resource limits and workspace settings will appear here.",
};

export type MessageKey = keyof typeof zh;

const translations: Record<Language, Record<MessageKey, string>> = { zh, en };

const STORAGE_KEY = "web-curl-language";

function initialLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: initialLanguage(),
  setLanguage: (language) => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Storage may be unavailable; the in-memory value still works.
    }
    set({ language });
  },
}));

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>) => {
      let text: string = translations[language][key] ?? key;
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    },
    [language],
  );

  return { t, language };
}
