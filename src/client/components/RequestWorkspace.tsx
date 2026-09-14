import { RequestToolbar } from "./RequestToolbar";
import { RequestTabs } from "./RequestTabs";
import { ResponsePanel } from "./ResponsePanel";

export function RequestWorkspace() {
  return (
    <div className="request-workspace-inner">
      <RequestToolbar />
      <RequestTabs />
      <ResponsePanel />
    </div>
  );
}
