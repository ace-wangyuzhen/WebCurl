import { useEffect, useState } from "react";
import { Empty, Typography } from "antd";
import type { EnvironmentRecord, EnvironmentVariable } from "../db/database";
import {
  collectionRepository,
  environmentRepository,
} from "../db/repositories";
import { useEditorStore } from "../state/editor-store";
import { VariableTable } from "./VariableTable";

interface CollectionVariablesPanelProps {
  collectionId: string;
}

export function CollectionVariablesPanel({
  collectionId,
}: CollectionVariablesPanelProps) {
  const [globals, setGlobals] = useState<EnvironmentVariable[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentRecord[]>([]);
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

  const handleEnvironmentVariablesChange = (items: EnvironmentVariable[]) => {
    if (!activeEnvironment) {
      return;
    }
    setEnvironments((prev) =>
      prev.map((env) =>
        env.id === activeEnvironment.id ? { ...env, variables: items } : env,
      ),
    );
    void environmentRepository.update(activeEnvironment.id, {
      variables: items,
    });
  };

  return (
    <div className="variables-panel">
      <section className="variables-section">
        <Typography.Title level={5}>Globals</Typography.Title>
        <Typography.Text type="secondary">
          Available to scripts as <code>pm.globals.get("name")</code>.
        </Typography.Text>
        <VariableTable
          items={globals}
          onChange={handleGlobalsChange}
          addLabel="Add variable"
          nameLabel={(index) => `Global variable name ${index}`}
          valueLabel={(index) => `Global variable value ${index}`}
          enableLabel={(index) => `Enable global variable ${index}`}
        />
      </section>

      <section className="variables-section">
        <Typography.Title level={5}>
          Environment: {activeEnvironment?.name ?? "None"}
        </Typography.Title>
        <Typography.Text type="secondary">
          Available to scripts as <code>pm.environment.get("name")</code>.
        </Typography.Text>
        {activeEnvironment ? (
          <VariableTable
            items={activeEnvironment.variables}
            onChange={handleEnvironmentVariablesChange}
            addLabel="Add variable"
            nameLabel={(index) => `Environment variable name ${index}`}
            valueLabel={(index) => `Environment variable value ${index}`}
            enableLabel={(index) => `Enable environment variable ${index}`}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No environments yet. Add one from the top toolbar."
          />
        )}
      </section>
    </div>
  );
}
