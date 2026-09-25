import type { Project } from "../types/project";

export function getProjectRevision(project: Project): number { return project.revision ?? 0; }

export function nextProjectRevision(project: Project): number {
  const current = getProjectRevision(project);
  if (!Number.isSafeInteger(current) || current < 0 || current === Number.MAX_SAFE_INTEGER) {
    throw new RangeError("Project revision must be a nonnegative safe integer below the maximum");
  }
  return current + 1;
}
