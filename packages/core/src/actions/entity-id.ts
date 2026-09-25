import type { Action } from "../types/actions";
import type { Project } from "../types/project";

export function allocateEntityId(action: Action, kind: string, project: Project, ordinal = 0): string {
  const suffix = ordinal ? `-${ordinal}` : "";
  const candidate = `${kind}-${action.id}${suffix}`;
  const timeline = project.timeline as any;
  const ids = new Set<string>([
    ...project.mediaLibrary.items.map((item) => item.id),
    ...(timeline.tracks ?? []).flatMap((track: any) => [track.id, ...(track.clips ?? []).map((clip: any) => clip.id), ...(track.transitions ?? []).map((item: any) => item.id)]),
    ...(timeline.subtitles ?? []).map((item: any) => item.id),
    ...(timeline.markers ?? []).map((item: any) => item.id),
  ]);
  if (ids.has(candidate)) throw Object.assign(new Error(`Duplicate entity id: ${candidate}`), { code: "DUPLICATE_ID", entityId: candidate });
  return candidate;
}
