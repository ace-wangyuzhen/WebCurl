import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Select,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  MoonOutlined,
  MoreOutlined,
  PlusOutlined,
  SettingOutlined,
  SunOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { EnvironmentRecord } from "../db/database";
import { environmentRepository } from "../db/repositories";
import { exportWorkspace, importWorkspace } from "../db/seed";
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

  const selectedCollectionId = useEditorStore((state) => state.selectedCollectionId);
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
    if (!envModal || !selectedCollectionId) {
      return;
    }
    const name = envName.trim();
    setEnvModal(null);
    if (name === "") {
      return;
    }
    if (envModal.action === "new") {
      await environmentRepository.create({
        collectionId: selectedCollectionId,
        name,
      });
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
          value={activeEnvironment?.id ?? null}
          options={environments.map((env) => ({
            value: env.id,
            label: env.name,
          }))}
          onChange={(value) => void handleSelectEnvironment(value as string)}
          aria-label="Active environment"
        />
        <Dropdown
          menu={{
            items: [
              {
                key: "new",
                label: "New Environment",
                icon: <PlusOutlined />,
              },
              ...(activeEnvironment
                ? [
                    { type: "divider" as const },
                    {
                      key: "rename",
                      label: "Rename Environment",
                      icon: <EditOutlined />,
                    },
                    {
                      key: "delete",
                      label: "Delete Environment",
                      icon: <DeleteOutlined />,
                      danger: true,
                    },
                  ]
                : []),
            ],
            onClick: ({ key }) => {
              if (key === "new") {
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
          <Button icon={<MoreOutlined />} aria-label="Environment actions" />
        </Dropdown>

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

      <Modal
        title={envModal?.action === "new" ? "New Environment" : "Rename Environment"}
        open={envModal !== null}
        onOk={() => void confirmEnvModal()}
        onCancel={() => setEnvModal(null)}
        okText={envModal?.action === "new" ? "Create" : "Rename"}
      >
        <Input
          value={envName}
          onChange={(event) => setEnvName(event.target.value)}
          onPressEnter={() => void confirmEnvModal()}
          aria-label="Environment name"
          autoFocus
        />
      </Modal>

      <Modal
        title={`Delete Environment ${deleteEnvTarget?.name ?? ""}`}
        open={deleteEnvTarget !== null}
        onOk={() => void confirmDeleteEnvironment()}
        onCancel={() => setDeleteEnvTarget(null)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <Typography.Paragraph>
          This will permanently delete this environment and its variables.
        </Typography.Paragraph>
      </Modal>
    </header>
  );
}
