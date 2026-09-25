/**
 * Pure helpers for local media import (WP1b §1.2).
 *
 * No `fs`, no Electron here: callers pass already-realpathed absolute
 * strings in, so this module stays unit-testable and UI-importable.
 * The desktop main process does `fs.realpath` before calling in.
 */

export const IMPORT_HOME_SENTINEL = "$HOME";

/** Max files imported by one `import_media_folder` call; rest are skipped. */
export const IMPORT_FOLDER_FILE_CAP = 500;

/** Suffix allow-list used when no glob is given (case-insensitive). */
export const IMPORT_MEDIA_SUFFIXES: readonly string[] = [
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
 * Expand the `$HOME` sentinel (or a `~` prefix equal to $HOME) to the real
 * home directory. Pure string operation.
 */
export function expandImportRoot(root: string, homeDir: string): string {
  if (root === IMPORT_HOME_SENTINEL) return homeDir;
  if (root === "~" || root.startsWith("~/")) return homeDir + root.slice(1);
  return root;
}

function splitPath(p: string): string[] {
  return p.split("/").filter((s) => s.length > 0);
}

/**
 * True when `candidate` equals `root` or is a descendant of it.
 * Both must already be absolute + realpathed. POSIX-style comparison;
 * the desktop side normalizes Windows separators before calling.
 */
export function isPathWithinRoot(candidate: string, root: string): boolean {
  const c = splitPath(candidate);
  const r = splitPath(root);
  if (r.length > c.length) return false;
  for (let i = 0; i < r.length; i++) {
    if (c[i] !== r[i]) return false;
  }
  return true;
}

/** True when `candidate` is within any of `roots`. */
export function isPathWithinRoots(
  candidate: string,
  roots: readonly string[],
): boolean {
  return roots.some((root) => isPathWithinRoot(candidate, root));
}

/**
 * Minimal glob matcher supporting only `*`, `?`, and `**`.
 * `**` matches across `/` but callers reject it when recursive is false.
 */
export function matchImportGlob(pattern: string, fileName: string): boolean {
  const escape = (s: string): string =>
    s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        re += ".*";
        i++;
      } else {
        re += "[^/]*";
      }
    } else if (ch === "?") {
      re += "[^/]";
    } else {
      re += escape(ch);
    }
  }
  return new RegExp(`^${re}$`, "i").test(fileName);
}

/** True when a `**` segment appears in the glob. */
export function globIsRecursive(pattern: string): boolean {
  return pattern.includes("**");
}

/** Suffix allow-list check (no glob given). Case-insensitive. */
export function hasAllowedMediaSuffix(fileName: string): boolean {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return false;
  const suffix = fileName.slice(dot + 1).toLowerCase();
  return (IMPORT_MEDIA_SUFFIXES as readonly string[]).includes(suffix);
}

/**
 * Decide whether a directory entry (relative path with `/` separators)
 * matches the folder-import filter.
 */
export function matchFolderEntry(
  relativePath: string,
  glob: string | undefined,
): boolean {
  if (!glob) {
    const base = relativePath.split("/").pop() ?? relativePath;
    return hasAllowedMediaSuffix(base);
  }
  // Patterns without a slash match against the basename; patterns with a
  // slash match against the whole relative path.
  const target = glob.includes("/") ? relativePath : (relativePath.split("/").pop() ?? relativePath);
  return matchImportGlob(glob, target);
}
