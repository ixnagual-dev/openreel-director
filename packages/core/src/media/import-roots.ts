/**
 * Pure (fs-free, Electron-free) helpers for WP1b local media import.
 *
 * The security boundary lives in the desktop main process, which realpaths
 * every path before calling the containment check here. Keeping this module
 * pure means the same logic is unit-testable in packages/core and reusable
 * by headless hosts.
 */

/** Sentinel stored in settings meaning "the OS home directory". */
export const HOME_SENTINEL = "$HOME";

/** Cap on files imported by a single import_media_folder call. */
export const MAX_FOLDER_IMPORT_FILES = 500;

/** Suffix allow-list used when import_media_folder gets no glob. */
export const MEDIA_SUFFIX_ALLOWLIST: readonly string[] = [
  "mp4",
  "mov",
  "webm",
  "mkv",
  "m4v",
  "mp3",
  "wav",
  "aac",
  "flac",
  "ogg",
  "m4a",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
];

/**
 * Expand a configured root: "$HOME" (or a "~" prefix equal to $HOME) becomes
 * the home directory. Anything else must already be absolute.
 * Returns null for a root that cannot be used.
 */
export function expandImportRoot(root: string, homeDir: string): string | null {
  const trimmed = root.trim();
  if (trimmed === HOME_SENTINEL || trimmed === "~") return homeDir;
  if (trimmed.startsWith("~/") || trimmed.startsWith(`${HOME_SENTINEL}/`)) {
    const rest = trimmed.slice(trimmed.startsWith("~/") ? 2 : HOME_SENTINEL.length + 1);
    if (!rest || rest.includes("\0")) return null;
    return joinPosix(homeDir, rest);
  }
  if (trimmed.startsWith("/") && !trimmed.includes("\0")) return trimmed;
  // Windows absolute path (defensive; main runs realpath anyway).
  if (/^[A-Za-z]:[\\/]/.test(trimmed) && !trimmed.includes("\0")) return trimmed;
  return null;
}

/** Expand every configured root, dropping unusable entries. */
export function expandImportRoots(roots: readonly string[], homeDir: string): string[] {
  const out: string[] = [];
  for (const root of roots) {
    const expanded = expandImportRoot(root, homeDir);
    if (expanded) out.push(expanded);
  }
  return out;
}

function joinPosix(base: string, rest: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${b}/${rest}`;
}

function splitPath(value: string): string[] {
  return value.split("/").filter((part) => part.length > 0);
}

/**
 * True when the (already realpathed) candidate equals one of the (already
 * realpathed) roots or is a descendant of one. Pure string containment:
 * callers must pass already-realpathed absolute strings so symlinks cannot
 * escape the roots.
 */
export function isPathWithinRoots(candidate: string, realRoots: readonly string[]): boolean {
  const candParts = splitPath(candidate);
  for (const root of realRoots) {
    const rootParts = splitPath(root);
    if (rootParts.length > candParts.length) continue;
    let match = true;
    for (let i = 0; i < rootParts.length; i += 1) {
      if (rootParts[i] !== candParts[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Minimal glob matcher supporting only `*`, `?`, and `**`.
 * `**` matches across `/` but callers reject it for non-recursive walks.
 */
export function matchGlob(name: string, glob: string): boolean {
  const pattern = globToRegExp(glob);
  return pattern.test(name);
}

function globToRegExp(glob: string): RegExp {
  let out = "^";
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        out += ".*";
        i += 2;
        // A trailing or leading slash around ** is absorbed by .*
        continue;
      }
      out += "[^/]*";
      i += 1;
      continue;
    }
    if (c === "?") {
      out += "[^/]";
      i += 1;
      continue;
    }
    out += escapeRegExpChar(c);
    i += 1;
  }
  out += "$";
  return new RegExp(out);
}

function escapeRegExpChar(c: string): string {
  return c.replace(/[.*+?^${}()|[\]\\]/, "\\$&");
}

/** Lowercase suffix without the dot; "" when there is none. */
export function fileSuffix(fileName: string): string {
  const base = fileName.split("/").pop() ?? fileName;
  const dot = base.lastIndexOf(".");
  if (dot < 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1).toLowerCase();
}

/** True when the file passes the suffix allow-list (no-glob default). */
export function isAllowedMediaFile(fileName: string): boolean {
  return (MEDIA_SUFFIX_ALLOWLIST as readonly string[]).includes(fileSuffix(fileName));
}

export type ClipFitMode = "cover" | "contain" | "stretch";

const FIT_MODES: readonly string[] = ["cover", "contain", "stretch"];

/** True for the three accepted fit modes (never "none" from tools). */
export function isClipFitMode(value: unknown): value is ClipFitMode {
  return typeof value === "string" && (FIT_MODES as readonly string[]).includes(value);
}

/**
 * Clip-create fit resolution, in order: explicit add_clip fitMode arg, then
 * transform.fitMode on the same action (excluding "none"), then the project
 * defaultFitMode, then "contain".
 */
export function resolveClipFitMode(
  fitModeArg: unknown,
  transformFitMode: unknown,
  defaultFitMode: unknown,
): ClipFitMode {
  if (isClipFitMode(fitModeArg)) return fitModeArg;
  if (isClipFitMode(transformFitMode)) return transformFitMode;
  if (isClipFitMode(defaultFitMode)) return defaultFitMode;
  return "contain";
}
