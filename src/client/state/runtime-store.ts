import { create } from "zustand";
import type { ExecuteResponse } from "../../shared/contracts";

export interface RuntimeError {
  code: string;
  message: string;
}

interface RuntimeState {
  isSending: boolean;
  activeResponse: ExecuteResponse | null;
  activeError: RuntimeError | null;
  activeCurl: string | null;
  scriptLogs: string[];
  unresolvedVariables: string[];
  startSend: () => void;
  finishSend: (response: ExecuteResponse) => void;
  failSend: (error: RuntimeError) => void;
  cancelSend: () => void;
  appendLogs: (logs: string[]) => void;
  setUnresolvedVariables: (variables: string[]) => void;
  setActiveCurl: (curl: string) => void;
  clearResponse: () => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  isSending: false,
  activeResponse: null,
  activeError: null,
  activeCurl: null,
  scriptLogs: [],
  unresolvedVariables: [],

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
}));
