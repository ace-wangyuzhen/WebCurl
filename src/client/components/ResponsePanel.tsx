import { Alert, Empty } from "antd";
import { useRuntimeStore } from "../state/runtime-store";

export function ResponsePanel() {
  const activeResponse = useRuntimeStore((state) => state.activeResponse);
  const activeError = useRuntimeStore((state) => state.activeError);

  if (!activeResponse && !activeError) {
    return (
      <div className="response-panel" role="region" aria-label="Response">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No response yet"
        />
      </div>
    );
  }

  return (
    <div className="response-panel" role="region" aria-label="Response">
      {activeError ? (
        <Alert
          type="error"
          showIcon
          message={activeError.code}
          description={activeError.message}
        />
      ) : (
        <span>Status: {activeResponse?.status}</span>
      )}
    </div>
  );
}
