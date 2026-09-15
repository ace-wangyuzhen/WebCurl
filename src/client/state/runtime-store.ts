import { create } from "zustand";
import type { ExecuteResponse } from "../../shared/contracts";

export interface RuntimeError {
  code: string;
  message: string;
}

// A per-request view of the last run. Kept in memory only (this store is not
// persisted), so responses survive switching between requests within a session
// but reset on a hard refresh or when the browser is closed.
interface RuntimeSnapshot {
  activeResponse: ExecuteResponse | null;
  activeError: RuntimeError | null;
  activeCurl: string | null;
  scriptLogs: string[];
  unresolvedVariables: string[];
}

interface RuntimeState {
  isSending: boolean;
  activeResponse: ExecuteResponse | null;
  activeError: RuntimeError | null;
  activeCurl: string | null;
  scriptLogs: string[];
  unresolvedVariables: string[];
  snapshots: Record<string, RuntimeSnapshot>;
  startSend: () => void;
  finishSend: (response: ExecuteResponse) => void;
  showResponse: (response: ExecuteResponse) => void;
  failSend: (error: RuntimeError) => void;
  cancelSend: () => void;
  appendLogs: (logs: string[]) => void;
  setUnresolvedVariables: (variables: string[]) => void;
  setActiveCurl: (curl: string) => void;
  clearResponse: () => void;
  persistSnapshot: (requestId: string) => void;
  restoreSnapshot: (requestId: string | null) => void;
}

const EMPTY_RESPONSE = {
  activeResponse: null,
  activeError: null,
  activeCurl: null,
  scriptLogs: [] as string[],
  unresolvedVariables: [] as string[],
};

export const useRuntimeStore = create<RuntimeState>((set) => ({
  isSending: false,
  activeResponse: null,
  activeError: null,
  activeCurl: null,
  scriptLogs: [],
  unresolvedVariables: [],
  snapshots: {},

  startSend: () =>
    set({
      isSending: true,
      activeResponse: null,
      activeError: null,
      activeCurl: null,
      scriptLogs: [],
      unresolvedVariables: [],
    }),

  finishSend: (response) =>
    set({ isSending: false, activeResponse: response, activeError: null }),

  showResponse: (response) =>
    set({
      isSending: false,
      activeResponse: response,
      activeError: null,
      activeCurl: null,
      scriptLogs: [],
      unresolvedVariables: [],
    }),

  failSend: (error) =>
    set({ isSending: false, activeResponse: null, activeError: error }),

  cancelSend: () => set({ isSending: false }),

  appendLogs: (logs) =>
    set((state) => ({ scriptLogs: [...state.scriptLogs, ...logs] })),

  setUnresolvedVariables: (variables) =>
    set({ unresolvedVariables: variables }),

  setActiveCurl: (curl) => set({ activeCurl: curl }),

  clearResponse: () =>
    set({
      activeResponse: null,
      activeError: null,
      activeCurl: null,
      scriptLogs: [],
      unresolvedVariables: [],
    }),

  persistSnapshot: (requestId) =>
    set((state) => ({
      snapshots: {
        ...state.snapshots,
        [requestId]: {
          activeResponse: state.activeResponse,
          activeError: state.activeError,
          activeCurl: state.activeCurl,
          scriptLogs: state.scriptLogs,
          unresolvedVariables: state.unresolvedVariables,
        },
      },
    })),

  restoreSnapshot: (requestId) =>
    set((state) => {
      const snapshot = requestId ? state.snapshots[requestId] : undefined;
      return snapshot ? { ...snapshot } : { ...EMPTY_RESPONSE };
    }),
}));
