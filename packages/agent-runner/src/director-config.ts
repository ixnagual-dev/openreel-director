import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { DEFAULT_DIRECTOR_CONFIG, parseDirectorConfig, type DirectorConfig } from "@openreel/core/director/config";

export interface DirectorConfigLocation { projectPath?: string; projectDir?: string }
export interface DirectorConfigResult { config: DirectorConfig; source: "file" | "default"; path?: string }
export interface DirectorConfigIO { readFile(path: string, encoding: "utf8"): Promise<string> }

export async function loadDirectorConfig(
  location: DirectorConfigLocation,
  io: DirectorConfigIO = { readFile },
): Promise<DirectorConfigResult> {
  if (!location.projectPath && !location.projectDir) return { config: DEFAULT_DIRECTOR_CONFIG, source: "default" };
  const projectPath = location.projectPath ? resolve(location.projectPath) : undefined;
  const projectDir = location.projectDir ? resolve(location.projectDir) : undefined;
  if (projectPath && !isAbsolute(projectPath)) throw new Error("Project path must be absolute");
  const directory = projectDir ?? (projectPath ? dirname(projectPath) : undefined)!;
  if (projectPath && projectDir && dirname(projectPath) !== projectDir) {
    throw Object.assign(new Error("projectPath and projectDir refer to different directories"), { code: "CONFIG_INVALID" });
  }
  const path = resolve(directory, ".openreel", "director.json");
  try {
    return { config: parseDirectorConfig(await io.readFile(path, "utf8")), source: "file", path };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return { config: DEFAULT_DIRECTOR_CONFIG, source: "default", path };
    if ((error as { code?: string })?.code === "CONFIG_INVALID") throw error;
    throw Object.assign(new Error(`Unable to read Director config at ${path}`), { code: "CONFIG_READ_FAILED", cause: error });
  }
}
