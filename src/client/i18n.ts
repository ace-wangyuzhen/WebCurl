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
  "env.defaultProd": "正式环境",
  "env.defaultTest": "测试环境",
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
  "common.copied": "已复制",
  "common.copyFailed": "复制失败",
  "common.move": "移动",
  "common.ok": "确定",
  "common.copySuffix": "（副本）",
  "toolbar.import": "导入工作区",
  "toolbar.export": "导出工作区",
  "export.title": "导出工作区",
  "export.all": "导出全部",
  "export.custom": "自定义选择",
  "export.allHint": "导出全部集合、文件夹、接口和环境。",
  "export.confirm": "导出",
  "export.empty": "暂无可导出的内容",
  "export.emptySelection": "请至少勾选一个接口或文件夹",
  "toolbar.settings": "设置",
  "toolbar.theme.toggle": "切换主题",
  "toolbar.theme.toLight": "切换到亮色主题",
  "toolbar.theme.toDark": "切换到暗色主题",
  "toolbar.language": "语言",
  "layout.resizeSidebar": "拖动调整侧边栏宽度",
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

  // Import from curl
  "curlImport.menu": "从 curl 导入请求",
  "curlImport.title": "从 curl 导入请求",
  "curlImport.confirm": "导入",
  "curlImport.placeholder": "在此粘贴 curl 命令",
  "curlImport.inputAria": "curl 命令",
  "curlImport.namePlaceholder": "请求名称",
  "curlImport.nameAria": "请求名称",
  "curlImport.error": "无法解析该 curl 命令，请检查格式",

  // Folder request list
  "folder.requests": "接口列表",
  "folder.noRequests": "这个文件夹还没有接口。右键文件夹可新建请求或从 curl 导入。",

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

  // Keyboard shortcuts
  "shortcuts.title": "键盘快捷键",
  "shortcuts.send": "发送请求",
  "shortcuts.save": "保存请求",
  "shortcuts.cancel": "取消发送",

  // Request tabs
  "tab.params": "查询参数",
  "tab.headers": "请求头",
  "tab.body": "请求体",
  "tab.script": "预请求脚本",

  // Key-value tables
  "table.name": "名称",
  "table.value": "值",
  "table.deleteRow": "删除行",
  "table.expand": "最大化编辑",
  "table.expandAria": "最大化编辑值 {n}",
  "table.expandTitle": "编辑值",

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
  "body.format": "格式化",

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
  "response.copyHeaderNameAria": "复制请求头名称 {name}",
  "response.copyHeaderValueAria": "复制请求头值 {name}",
  "response.pretty": "格式化",
  "response.raw": "原始",
  "response.truncated":
    "响应过大，仅渲染前 {shown} KB（共 {total} KB）。复制可获取完整内容。",
  "curl.copyAria": "复制 curl 命令",

  // History
  "history.title": "历史记录",
  "history.empty": "暂无历史记录",
  "history.emptyRequest": "该请求还没有运行记录",
  "history.unsavedHint": "保存并运行该请求后，这里会显示它的历史记录",
  "history.clear": "清空",
  "history.clearConfirm": "清空所有历史记录？",
  "history.clearRequestConfirm": "清空该请求的历史记录？",
  "history.replayAria": "回放 {url}",

  // Settings drawer
  "settings.section.request": "请求默认",
  "settings.section.response": "响应展示",
  "settings.section.data": "数据管理",
  "settings.timeout": "默认超时（毫秒）",
  "settings.followRedirects": "跟随重定向",
  "settings.maxRedirects": "最大重定向数",
  "settings.prettyByDefault": "默认格式化响应",
  "settings.wrapLines": "响应自动换行",
  "settings.maxRenderBytes": "响应渲染上限（KB）",
  "settings.storageUsage": "本地存储占用",
  "settings.storageUnknown": "无法获取存储用量",
  "settings.reset": "清空全部数据 / 重置工作区",
  "settings.resetTitle": "重置工作区",
  "settings.resetDesc":
    "这将永久删除所有集合、文件夹、请求、环境、历史记录和设置，且无法恢复。",
  "settings.resetConfirmHint": "请输入 {word} 以确认",
  "settings.resetConfirmAria": "输入确认词",
  "settings.resetDone": "工作区已重置",

  // Docs page
  "docs.title": "使用文档",
  "docs.back": "返回",
  "docs.toc": "目录",
  "docs.overview.title": "平台简介",
  "docs.overview.body":
    "Web Curl 是一个单用户 HTTP 请求调试工具，作为单个 Node.js 进程运行，前端界面与 API 同源部署。所有集合、请求、环境与历史记录都保存在浏览器本地（IndexedDB）中，服务端无状态，一次仅校验并执行一个请求。",
  "docs.collections.title": "集合 / 文件夹 / 请求",
  "docs.collections.body":
    "在左侧树中按 集合 → 文件夹 → 请求 组织接口。右键可新建、重命名、移动、复制或删除；拖动分隔条可调整侧边栏宽度。",
  "docs.building.title": "构建 HTTP 请求",
  "docs.building.body":
    "选择方法、填写 URL，并在下方标签页中配置查询参数、请求头与请求体。请求体支持四种类型：无、文本、JSON、表单编码。",
  "docs.building.exampleLabel": "请求栏示例",
  "docs.scripts.title": "预请求脚本",
  "docs.scripts.body":
    "在预请求脚本标签页中编写 JavaScript，脚本运行在 QuickJS 沙箱中，无法访问 DOM 或网络。可通过 `pm.globals`、`pm.environment` 读写变量，通过 `pm.request` 修改请求，用 `console.log` 输出日志。执行顺序为：集合 → 文件夹（由外到内）→ 请求。",
  "docs.environments.title": "环境与变量",
  "docs.environments.body":
    "在顶部工具栏管理环境（默认包含正式环境与测试环境）。在 URL、参数、请求头、请求体中使用 `{{变量名}}` 进行替换；未解析的变量会保留原样并显示警告。环境变量优先级高于全局变量。",
  "docs.response.title": "发送与查看响应",
  "docs.response.body":
    "点击发送执行请求，可随时取消。响应区展示状态码、耗时、大小与响应头；正文可在格式化与原始之间切换，并可复制等价的 curl 命令。",
  "docs.curl.title": "从 curl 导入",
  "docs.curl.body":
    "在侧边栏右键文件夹选择「从 curl 导入请求」，粘贴 curl 命令即可生成请求。",
  "docs.importExport.title": "工作区导入 / 导出",
  "docs.importExport.body":
    "通过顶部工具栏的导入 / 导出备份或迁移整个工作区（JSON 格式）。导入会替换当前工作区。",
  "docs.history.title": "历史记录",
  "docs.history.body":
    "保存并运行请求后，其运行记录会出现在历史记录面板，可回放或清空。",
  "docs.settings.title": "设置",
  "docs.settings.body":
    "在设置中调整默认超时、重定向、默认格式化、自动换行与响应渲染上限，也可清空全部数据以重置工作区。",
  "docs.shortcuts.title": "键盘快捷键",
  "docs.shortcuts.body":
    "发送请求：`⌘/Ctrl + Enter`；保存请求：`⌘/Ctrl + S`；取消发送：`Esc`。",
};

const en: Record<keyof typeof zh, string> = {
  "env.selectCollection": "Select a collection",
  "env.none": "No environment",
  "env.new": "New Environment",
  "env.rename": "Rename Environment",
  "env.delete": "Delete Environment",
  "env.defaultProd": "Production",
  "env.defaultTest": "Test",
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
  "common.copied": "Copied",
  "common.copyFailed": "Copy failed",
  "common.move": "Move",
  "common.ok": "OK",
  "common.copySuffix": " (copy)",
  "toolbar.import": "Import workspace",
  "toolbar.export": "Export workspace",
  "export.title": "Export workspace",
  "export.all": "Export everything",
  "export.custom": "Choose items",
  "export.allHint": "Exports every collection, folder, request, and environment.",
  "export.confirm": "Export",
  "export.empty": "Nothing to export yet",
  "export.emptySelection": "Pick at least one request or folder",
  "toolbar.settings": "Settings",
  "toolbar.theme.toggle": "Toggle theme",
  "toolbar.theme.toLight": "Switch to light theme",
  "toolbar.theme.toDark": "Switch to dark theme",
  "toolbar.language": "Language",
  "layout.resizeSidebar": "Drag to resize the sidebar",
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
  "curlImport.menu": "Import from curl",
  "curlImport.title": "Import request from curl",
  "curlImport.confirm": "Import",
  "curlImport.placeholder": "Paste your curl command here",
  "curlImport.inputAria": "curl command",
  "curlImport.namePlaceholder": "Request name",
  "curlImport.nameAria": "Request name",
  "curlImport.error": "Could not parse this curl command. Please check the format.",
  "folder.requests": "Requests",
  "folder.noRequests":
    "This folder has no requests yet. Right-click the folder to add one or import from curl.",
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
  "shortcuts.title": "Keyboard shortcuts",
  "shortcuts.send": "Send request",
  "shortcuts.save": "Save request",
  "shortcuts.cancel": "Cancel sending",
  "tab.params": "Params",
  "tab.headers": "Headers",
  "tab.body": "Body",
  "tab.script": "Pre-Request Script",
  "table.name": "Name",
  "table.value": "Value",
  "table.deleteRow": "Delete row",
  "table.expand": "Expand editor",
  "table.expandAria": "Expand value editor {n}",
  "table.expandTitle": "Edit value",
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
  "body.format": "Format",
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
  "response.copyHeaderNameAria": "Copy header name {name}",
  "response.copyHeaderValueAria": "Copy header value {name}",
  "response.pretty": "Pretty",
  "response.raw": "Raw",
  "response.truncated":
    "Response too large — rendering the first {shown} KB of {total} KB. Copy to get the full body.",
  "curl.copyAria": "Copy curl command",
  "history.title": "History",
  "history.empty": "No history yet",
  "history.emptyRequest": "No runs for this request yet",
  "history.unsavedHint": "Save and run this request to see its history here",
  "history.clear": "Clear",
  "history.clearConfirm": "Clear all history?",
  "history.clearRequestConfirm": "Clear this request's history?",
  "history.replayAria": "Replay {url}",
  "settings.section.request": "Request defaults",
  "settings.section.response": "Response display",
  "settings.section.data": "Data management",
  "settings.timeout": "Default timeout (ms)",
  "settings.followRedirects": "Follow redirects",
  "settings.maxRedirects": "Max redirects",
  "settings.prettyByDefault": "Pretty-print by default",
  "settings.wrapLines": "Wrap long lines",
  "settings.maxRenderBytes": "Response render cap (KB)",
  "settings.storageUsage": "Local storage usage",
  "settings.storageUnknown": "Storage usage unavailable",
  "settings.reset": "Clear all data / Reset workspace",
  "settings.resetTitle": "Reset workspace",
  "settings.resetDesc":
    "This permanently deletes all collections, folders, requests, environments, history, and settings. This cannot be undone.",
  "settings.resetConfirmHint": "Type {word} to confirm",
  "settings.resetConfirmAria": "Confirmation word",
  "settings.resetDone": "Workspace has been reset",

  // Docs page
  "docs.title": "Documentation",
  "docs.back": "Back",
  "docs.toc": "On this page",
  "docs.overview.title": "Platform overview",
  "docs.overview.body":
    "Web Curl is a single-user HTTP debugging tool that runs as one Node.js process, serving the UI and API from the same origin. All collections, requests, environments, and history live in the browser via IndexedDB; the server is stateless and only validates and executes one request at a time.",
  "docs.collections.title": "Collections, folders, and requests",
  "docs.collections.body":
    "Organize requests in the left tree as collections → folders → requests. Right-click to create, rename, move, copy, or delete; drag the divider to resize the sidebar.",
  "docs.building.title": "Building a request",
  "docs.building.body":
    "Pick a method, enter the URL, then configure query params, headers, and body in the tabs below. Bodies support four types: none, text, JSON, and form-urlencoded.",
  "docs.building.exampleLabel": "Request bar example",
  "docs.scripts.title": "Pre-request scripts",
  "docs.scripts.body":
    "Write JavaScript in the Pre-request Script tab. It runs in a QuickJS sandbox with no DOM or network access. Read and write variables with `pm.globals` and `pm.environment`, mutate the request with `pm.request`, and log with `console.log`. Execution order: collection → folders (outermost first) → request.",
  "docs.environments.title": "Environments and variables",
  "docs.environments.body":
    "Manage environments from the top toolbar (Production and Test ship by default). Use `{{variable}}` in URLs, params, headers, and bodies; unresolved variables stay as-is with a warning. Environment values take precedence over globals.",
  "docs.response.title": "Sending and inspecting responses",
  "docs.response.body":
    "Click Send to execute a request and cancel anytime. The response shows status, duration, size, and headers; switch the body between Pretty and Raw, and copy the equivalent curl command.",
  "docs.curl.title": "Importing from curl",
  "docs.curl.body":
    "Right-click a folder and choose Import from curl, then paste a curl command to generate a request.",
  "docs.importExport.title": "Workspace import / export",
  "docs.importExport.body":
    "Use Import / Export in the top toolbar to back up or migrate the whole workspace as JSON. Importing replaces the current workspace.",
  "docs.history.title": "History",
  "docs.history.body":
    "After saving and running a request, its runs appear in the History panel, where you can replay or clear them.",
  "docs.settings.title": "Settings",
  "docs.settings.body":
    "Adjust default timeout, redirects, pretty-print by default, line wrapping, and the render cap in Settings, or reset the workspace.",
  "docs.shortcuts.title": "Keyboard shortcuts",
  "docs.shortcuts.body":
    "Send: `⌘/Ctrl + Enter`; Save: `⌘/Ctrl + S`; Cancel: `Esc`.",
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
