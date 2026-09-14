import type { RequestDefinition } from "../../shared/request-types";

export interface SubstitutionResult {
  value: RequestDefinition;
  unresolved: string[];
}

const VARIABLE_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function mergeVariables(
  globals: Record<string, string>,
  environment: Record<string, string>,
): Record<string, string> {
  // Environment variables take precedence over globals on name collision.
  return { ...globals, ...environment };
}

export function substituteVariables(
  request: RequestDefinition,
  environment: Record<string, string>,
): SubstitutionResult {
  const unresolved = new Set<string>();

  const resolve = (text: string): string =>
    text.replace(VARIABLE_PATTERN, (match, name: string) => {
      const value = environment[name];
      if (value === undefined) {
        unresolved.add(name);
        return match;
      }
      return value;
    });

  return {
    value: {
      method: request.method,
      url: resolve(request.url),
      query: request.query.map((item) => ({
        ...item,
        key: resolve(item.key),
        value: resolve(item.value),
      })),
      headers: request.headers.map((item) => ({
        ...item,
        key: resolve(item.key),
        value: resolve(item.value),
      })),
      body: {
        type: request.body.type,
        content: resolve(request.body.content),
      },
    },
    unresolved: [...unresolved],
  };
}
