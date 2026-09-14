import { z } from "zod";
import { AppError } from "../errors";

const MAX_URL_LENGTH = 8 * 1024;
const MAX_ENTRIES = 512;
const MAX_KEY_LENGTH = 1024;
const MAX_VALUE_LENGTH = 16 * 1024;
const MAX_BODY_LENGTH = 10 * 1024 * 1024;

const keyValueItemSchema = z.object({
  id: z.string().max(128),
  key: z.string().max(MAX_KEY_LENGTH),
  value: z.string().max(MAX_VALUE_LENGTH),
  enabled: z.boolean(),
  description: z.string().max(MAX_KEY_LENGTH).optional(),
});

const bodySchema = z.object({
  type: z.enum(["none", "text", "json", "form-urlencoded"]),
  content: z.string().max(MAX_BODY_LENGTH),
});

export const executeRequestSchema = z.object({
  method: z.string().trim().min(1).max(32),
  url: z.string().trim().min(1).max(MAX_URL_LENGTH),
  query: z.array(keyValueItemSchema).max(MAX_ENTRIES),
  headers: z.array(keyValueItemSchema).max(MAX_ENTRIES),
  body: bodySchema,
  options: z
    .object({
      timeoutMs: z.number().int().min(1).max(300_000).optional(),
      followRedirects: z.boolean().optional(),
    })
    .optional(),
});

export type ExecuteRequestInput = z.infer<typeof executeRequestSchema>;

function validateTargetUrl(rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError("INVALID_URL", "Invalid target URL", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError(
      "UNSUPPORTED_PROTOCOL",
      "Only http and https URLs are supported",
      400,
    );
  }
}

const MAX_REPORTED_ISSUES = 8;

function formatValidationIssues(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): string {
  const shown = issues.slice(0, MAX_REPORTED_ISSUES).map((issue) => {
    const location = issue.path.length > 0 ? issue.path.join(".") : "request";
    return `${location}: ${issue.message}`;
  });
  const remainder = issues.length - shown.length;
  const suffix = remainder > 0 ? ` (+${remainder} more)` : "";
  return shown.join("; ") + suffix;
}

export function validateExecuteRequest(input: unknown): ExecuteRequestInput {
  const parsed = executeRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "INVALID_REQUEST",
      formatValidationIssues(parsed.error.issues) || "Invalid execute request",
      400,
    );
  }

  validateTargetUrl(parsed.data.url);
  return parsed.data;
}
