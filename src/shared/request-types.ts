export type BodyType = "none" | "text" | "json" | "form-urlencoded";

export interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface RequestBody {
  type: BodyType;
  content: string;
}

export interface RequestDefinition {
  method: string;
  url: string;
  query: KeyValueItem[];
  headers: KeyValueItem[];
  body: RequestBody;
}
