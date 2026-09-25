import type { Project } from "../types/project";
import type { DirectorProjectState, JsonValue } from "./types";

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).every(isJsonValue);
  return false;
}

export function normalizeDirectorStoredFields(project: Project): Project {
  const revision = project.revision ?? 0;
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw Object.assign(new Error("Project revision must be a nonnegative safe integer"), { code: "INVALID_REVISION" });
  }
  if (project.director !== undefined) {
    const director = project.director as DirectorProjectState;
    if (!director || typeof director !== "object" || director.schemaVersion !== 1) {
      throw Object.assign(new Error("Unsupported Director project schema version"), { code: "UNSUPPORTED_DIRECTOR_VERSION" });
    }
    if (director.extensions !== undefined && (!director.extensions || typeof director.extensions !== "object" || Array.isArray(director.extensions) || !isJsonValue(director.extensions))) {
      throw Object.assign(new Error("Director extensions must contain JSON values"), { code: "INVALID_DIRECTOR_STATE" });
    }
  }
  return { ...project, revision };
}
