import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  DownOutlined,
  DownloadOutlined,
  EditOutlined,
  EnvironmentOutlined,
  MoonOutlined,
  PlusOutlined,
  SettingOutlined,
  SunOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { EnvironmentRecord } from "../db/database";
import { environmentRepository } from "../db/repositories";
import { exportWorkspace, importWorkspace } from "../db/seed";
import { useLanguageStore, useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";
import type { ThemeMode } from "../theme";

interface TopToolbarProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

interface EnvModalState {
  action: "new" | "rename";
  id?: string;
  name?: string;
}

export function TopToolbar({
  themeMode,
  onToggleTheme,
  onOpenSettings,
}: TopToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useTranslation();
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const selectedCollectionId = useEditorStore(
    (state) => state.selectedCollectionId,
  );
  const workspaceVersion = useEditorStore((state) => state.workspaceVersion);

  const [environments, setEnvironments] = useState<EnvironmentRecord[]>([]);
  const [envModal, setEnvModal] = useState<EnvModalState | null>(null);
  const [envName, setEnvName] = useState("");
  const [deleteEnvTarget, setDeleteEnvTarget] = useState<EnvironmentRecord | null>(
    null,
  );

  const loadEnvironments = useCallback(async () => {
    if (!selectedCollectionId) {
      setEnvironments([]);
      return;
    }
    setEnvironments(
      await environmentRepository.listByCollection(selectedCollectionId),
    );
  }, [selectedCollectionId]);

  useEffect(() => {
    void loadEnvironments();
  }, [loadEnvironments, workspaceVersion]);

  const activeEnvironment =
    environments.find((env) => env.isActive) ?? environments[0] ?? null;

  const handleSelectEnvironment = async (envId: string) => {
    if (!selectedCollectionId) {
      return;
    }
    await environmentRepository.setActive(selectedCollectionId, envId);
    useEditorStore.getState().bumpWorkspaceVersion();
  };

  const confirmEnvModal = async () => {
    if (!envModal) {
      return;
    }
    if (!selectedCollectionId) {
      setEnvModal(null);
      void message.warning(t("env.selectCollection"));
      return;
    }
    const name = envName.trim();
    setEnvModal(null);
    if (name === "") {
      return;
    }
    if (envModal.action === "new") {
      const created = await environmentRepository.create({
        collectionId: selectedCollectionId,
        name,
      });
      await environmentRepository.setActive(selectedCollectionId, created.id);
    } else if (envModal.id) {
      await environmentRepository.update(envModal.id, { name });
    }
    useEditorStore.getState().bumpWorkspaceVersion();
  };

  const confirmDeleteEnvironment = async () => {
    if (!deleteEnvTarget) {
      return;
    }
    setDeleteEnvTarget(null);
    await environmentRepository.remove(deleteEnvTarget.id);
    useEditorStore.getState().bumpWorkspaceVersion();
  };

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
      if (window.confirm(t("import.confirm"))) {
        await importWorkspace(data);
        useEditorStore.getState().bumpWorkspaceVersion();
        void message.success(t("import.success"));
      }
    } catch {
      void message.error(t("import.fail"));
    }
  };

  return (
    <header className="top-toolbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          {"$"}
        </span>
        <h1 className="brand-name">Web Curl</h1>
      </div>

      <div className="top-toolbar-actions">
        <Dropdown
          menu={{
            items: [
              ...environments.map((env) => ({
                key: `env-${env.id}`,
                label: env.name,
                icon:
                  env.id === activeEnvironment?.id ? (
                    <CheckOutlined />
                  ) : undefined,
              })),
              ...(environments.length > 0
                ? [{ type: "divider" as const }]
                : []),
              {
                key: "new",
                label: t("env.new"),
                icon: <PlusOutlined />,
              },
              ...(activeEnvironment
                ? [
                    {
                      key: "rename",
                      label: t("env.rename"),
                      icon: <EditOutlined />,
                    },
                    {
                      key: "delete",
                      label: t("env.delete"),
                      icon: <DeleteOutlined />,
                      danger: true,
                    },
                  ]
                : []),
            ],
            onClick: ({ key }) => {
              if (key.startsWith("env-")) {
                void handleSelectEnvironment(key.slice("env-".length));
              } else if (key === "new") {
                setEnvModal({ action: "new" });
                setEnvName("");
              } else if (key === "rename" && activeEnvironment) {
                setEnvModal({
                  action: "rename",
                  id: activeEnvironment.id,
                  name: activeEnvironment.name,
                });
                setEnvName(activeEnvironment.name);
              } else if (key === "delete" && activeEnvironment) {
                setDeleteEnvTarget(activeEnvironment);
              }
            },
          }}
          trigger={["click"]}
        >
          <button
            type="button"
            className="environment-trigger"
            disabled={!selectedCollectionId}
            aria-label={t("env.renameTitle")}
          >
            <EnvironmentOutlined className="environment-trigger-icon" />
            <span className="environment-trigger-label">
              {selectedCollectionId
                ? activeEnvironment?.name ?? t("env.none")
                : t("env.selectCollection")}
            </span>
            <DownOutlined className="environment-trigger-caret" />
          </button>
        </Dropdown>

        <Tooltip title={t("toolbar.language")}>
          <Button
            type="text"
            aria-label={t("toolbar.language")}
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
          >
            {language === "zh" ? "EN" : "中"}
          </Button>
        </Tooltip>

        <Tooltip title={t("toolbar.import")}>
          <Button
            type="text"
            icon={<UploadOutlined />}
            aria-label={t("toolbar.import")}
            onClick={() => fileInputRef.current?.click()}
          />
        </Tooltip>
        <Tooltip title={t("toolbar.export")}>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            aria-label={t("toolbar.export")}
            onClick={() => void handleExport()}
          />
        </Tooltip>
        <Tooltip title={t("toolbar.settings")}>
          <Button
            type="text"
            icon={<SettingOutlined />}
            aria-label={t("toolbar.settings")}
            onClick={onOpenSettings}
          />
        </Tooltip>
        <Tooltip
          title={
            themeMode === "dark"
              ? t("toolbar.theme.toLight")
              : t("toolbar.theme.toDark")
          }
        >
          <Button
            type="text"
            icon={themeMode === "dark" ? <SunOutlined /> : <MoonOutlined />}
            aria-label={t("toolbar.theme.toggle")}
            onClick={onToggleTheme}
          />
        </Tooltip>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        aria-label={t("toolbar.import")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          void handleImport(file);
          event.target.value = "";
        }}
      />

      <Modal
        title={envModal?.action === "new" ? t("env.newTitle") : t("env.renameTitle")}
        open={envModal !== null}
        onOk={() => void confirmEnvModal()}
        onCancel={() => setEnvModal(null)}
        okText={envModal?.action === "new" ? t("env.create") : t("common.rename")}
        okButtonProps={{ disabled: envName.trim() === "" }}
      >
        <Input
          value={envName}
          onChange={(event) => setEnvName(event.target.value)}
          onPressEnter={() => void confirmEnvModal()}
          aria-label={t("env.name")}
          autoFocus
        />
      </Modal>

      <Modal
        title={t("env.deleteTitle", { name: deleteEnvTarget?.name ?? "" })}
        open={deleteEnvTarget !== null}
        onOk={() => void confirmDeleteEnvironment()}
        onCancel={() => setDeleteEnvTarget(null)}
        okText={t("common.delete")}
        okButtonProps={{ danger: true }}
      >
        <Typography.Paragraph>{t("env.deleteDesc")}</Typography.Paragraph>
      </Modal>
    </header>
  );
}
