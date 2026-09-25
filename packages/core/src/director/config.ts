import type { JsonValue } from "./types";

export interface DirectorConfig {
  readonly schemaVersion: 1;
  readonly defaults: Readonly<Record<string, never>>;
  readonly extensions: Readonly<Record<string, JsonValue>>;
}

export const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = { schemaVersion: 1, defaults: {}, extensions: {} };

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || ["string", "boolean"].includes(typeof value)) return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  return typeof value === "object" && Object.values(value as Record<string, unknown>).every(isJsonValue);
}

export function parseDirectorConfig(text: string): DirectorConfig {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw Object.assign(new Error("director.json contains invalid JSON"), { code: "CONFIG_INVALID" }); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("director.json must be a JSON object"), { code: "CONFIG_INVALID" });
  const config = value as Record<string, unknown>;
  if (Object.keys(config).some((key) => !["schemaVersion", "defaults", "extensions"].includes(key)) || config.schemaVersion !== 1) {
    throw Object.assign(new Error("director.json has an unsupported schema or unknown top-level key"), { code: "CONFIG_INVALID" });
  }
  const defaults = config.defaults ?? {};
  const extensions = config.extensions ?? {};
  if (!defaults || typeof defaults !== "object" || Array.isArray(defaults) || Object.keys(defaults).length !== 0) {
    throw Object.assign(new Error("director.json defaults are not supported yet and must be empty"), { code: "CONFIG_INVALID" });
  }
  if (!extensions || typeof extensions !== "object" || Array.isArray(extensions) || !isJsonValue(extensions)) {
    throw Object.assign(new Error("director.json extensions must be JSON values"), { code: "CONFIG_INVALID" });
  }
  return { schemaVersion: 1, defaults: {}, extensions: extensions as Record<string, JsonValue> };
}
