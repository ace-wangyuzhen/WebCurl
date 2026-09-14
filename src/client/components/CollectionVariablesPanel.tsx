import { useEffect, useState } from "react";
import { Empty, Tabs, Typography } from "antd";
import type { EnvironmentRecord, EnvironmentVariable } from "../db/database";
import {
  collectionRepository,
  environmentRepository,
} from "../db/repositories";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";
import { VariableTable } from "./VariableTable";

interface CollectionVariablesPanelProps {
  collectionId: string;
}

export function CollectionVariablesPanel({
  collectionId,
}: CollectionVariablesPanelProps) {
  const { t } = useTranslation();
  const [globals, setGlobals] = useState<EnvironmentVariable[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const workspaceVersion = useEditorStore((state) => state.workspaceVersion);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const collection = await collectionRepository.get(collectionId);
      const envs = await environmentRepository.listByCollection(collectionId);
      if (!cancelled) {
        setGlobals(collection?.globals ?? []);
        setEnvironments(envs);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [collectionId, workspaceVersion]);

  const activeEnvironment =
    environments.find((env) => env.isActive) ?? environments[0] ?? null;

  const handleGlobalsChange = (items: EnvironmentVariable[]) => {
    setGlobals(items);
    void collectionRepository.update(collectionId, { globals: items });
  };

  const handleEnvironmentVariablesChange = (
    envId: string,
    items: EnvironmentVariable[],
  ) => {
    setEnvironments((prev) =>
      prev.map((env) =>
        env.id === envId ? { ...env, variables: items } : env,
      ),
    );
    void environmentRepository.update(envId, { variables: items });
  };

  return (
    <div className="variables-panel">
      <section className="variables-section">
        <Typography.Title level={5}>{t("vars.globals")}</Typography.Title>
        <Typography.Text type="secondary">
          {t("vars.globalsHint")}
        </Typography.Text>
        <VariableTable
          items={globals}
          onChange={handleGlobalsChange}
          addLabel={t("vars.add")}
          nameLabel={(index) => t("vars.globalName", { n: index })}
          valueLabel={(index) => t("vars.globalValue", { n: index })}
          enableLabel={(index) => t("vars.globalEnable", { n: index })}
        />
      </section>

      <section className="variables-section">
        <Typography.Title level={5}>{t("vars.environments")}</Typography.Title>
        <Typography.Text type="secondary">
          {t("vars.environmentsHint")}
        </Typography.Text>
        {environments.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("vars.noEnvironments")}
          />
        ) : (
          <Tabs
            activeKey={activeTab ?? activeEnvironment?.id}
            onChange={setActiveTab}
            items={environments.map((env) => ({
              key: env.id,
              label:
                env.id === activeEnvironment?.id
                  ? `${env.name} ${t("vars.active")}`
                  : env.name,
              children: (
                <VariableTable
                  items={env.variables}
                  onChange={(items) =>
                    handleEnvironmentVariablesChange(env.id, items)
                  }
                  addLabel={t("vars.add")}
                  nameLabel={(index) => t("vars.envName", { n: index })}
                  valueLabel={(index) => t("vars.envValue", { n: index })}
                  enableLabel={(index) => t("vars.envEnable", { n: index })}
                />
              ),
            }))}
          />
        )}
      </section>
    </div>
  );
}
