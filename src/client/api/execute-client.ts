import type { ExecuteRequest, ExecuteResponse } from "../../shared/contracts";

export class ClientRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ClientRequestError";
  }
}

export async function executeRequest(
  request: ExecuteRequest,
  signal: AbortSignal,
): Promise<ExecuteResponse> {
  let response: Response;
  try {
    response = await fetch("/api/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ClientRequestError("REQUEST_ABORTED", "Request was aborted");
    }
    throw new ClientRequestError(
      "UPSTREAM_CONNECTION_ERROR",
      "Failed to reach the server",
    );
  }

  if (!response.ok) {
    const envelope = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new ClientRequestError(
      envelope?.error?.code ?? "INTERNAL_ERROR",
      envelope?.error?.message ?? "Request failed",
    );
  }

  return (await response.json()) as ExecuteResponse;
}
