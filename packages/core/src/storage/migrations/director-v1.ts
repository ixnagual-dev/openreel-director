import type { Project } from "../../types/project";
import { normalizeDirectorStoredFields } from "../../director/normalize";

/** Pure and idempotent migration from pre-Director project records. */
export function migrateToDirectorV1(project: Project): Project {
  return normalizeDirectorStoredFields({ ...project, revision: project.revision ?? 0 });
}
