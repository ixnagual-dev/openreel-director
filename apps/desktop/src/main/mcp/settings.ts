import os from "node:os";
import path from "node:path";
import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";

export const DEFAULT_MCP_PORT = 45190;
export const SETTINGS_FILE_NAME = "settings.json";

export type McpBindSetting = "loopback" | { loopback: boolean; extra: string };

export interface McpSettings {
  /** Allowed import roots; "$HOME" sentinel expands via os.homedir(). */
  readonly "mcp.importRoots": string[];
  readonly "mcp.allowPrivateFetch": boolean;
  readonly "mcp.port": number;
  readonly "mcp.bind": McpBindSetting;
}

export const DEFAULT_MCP_SETTINGS: McpSettings = {
  "mcp.importRoots": ["$HOME"],
  "mcp.allowPrivateFetch": false,
  "mcp.port": DEFAULT_MCP_PORT,
  "mcp.bind": "loopback",
};

/** Overridable for tests. */
export function settingsFilePath(): string {
  const override = process.env.OPENREEL_SETTINGS_FILE;
  if (override && override.length > 0) return override;
  return path.join(os.homedir(), ".openreel", SETTINGS_FILE_NAME);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * An extra bind address must be a unicast IPv4 currently assigned to this
 * machine. Rejects 0.0.0.0, 127/8, and anything not local. Tailscale
 * 100.64/10 is allowed only when configured locally.
 */
export function isAllowedExtraBind(address: string): boolean {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address);
  if (!v4) return false;
  const octets = v4.slice(1).map(Number);
  if (octets.some((o) => o < 0 || o > 255)) return false;
  const [a] = octets;
  if (a === 0 || a === 127) return false;
  const local = new Set<string>();
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4") local.add(addr.address);
    }
  }
  return local.has(address);
}

/** Expand "$HOME" / "~" roots. A user-entered root must otherwise be absolute. */
export function normalizeImportRoot(root: string): string | null {
  if (root === "$HOME" || root === "~" || root.startsWith("~/")) {
    return path.join(os.homedir(), root === "$HOME" || root === "~" ? "" : root.slice(2));
  }
  if (root.startsWith("~")) return null;
  if (!path.isAbsolute(root)) return null;
  if (root.includes("\0")) return null;
  return path.normalize(root);
}

function sanitize(raw: unknown): McpSettings {
  const record = isRecord(raw) ? raw : {};
  const defaults = DEFAULT_MCP_SETTINGS;

  let importRoots = defaults["mcp.importRoots"];
  if (Array.isArray(record["mcp.importRoots"]) && record["mcp.importRoots"].length >= 1) {
    const normalized = (record["mcp.importRoots"] as unknown[])
      .filter((r): r is string => typeof r === "string")
      .map(normalizeImportRoot)
      .filter((r): r is string => r !== null);
    if (normalized.length >= 1) importRoots = normalized;
  }

  const allowPrivateFetch =
    typeof record["mcp.allowPrivateFetch"] === "boolean"
      ? (record["mcp.allowPrivateFetch"] as boolean)
      : defaults["mcp.allowPrivateFetch"];

  let port = defaults["mcp.port"];
  if (
    typeof record["mcp.port"] === "number" &&
    Number.isInteger(record["mcp.port"]) &&
    (record["mcp.port"] as number) >= 0 &&
    (record["mcp.port"] as number) <= 65535
  ) {
    port = record["mcp.port"] as number;
  }

  let bind: McpBindSetting = defaults["mcp.bind"];
  const rawBind = record["mcp.bind"];
  if (rawBind === "loopback") {
    bind = "loopback";
  } else if (isRecord(rawBind) && typeof rawBind.extra === "string") {
    if (isAllowedExtraBind(rawBind.extra)) {
      bind = { loopback: true, extra: rawBind.extra };
    }
  }

  return { "mcp.importRoots": importRoots, "mcp.allowPrivateFetch": allowPrivateFetch, "mcp.port": port, "mcp.bind": bind };
}

export function loadMcpSettings(): McpSettings {
  try {
    const raw = readFileSync(settingsFilePath(), "utf8");
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_MCP_SETTINGS };
  }
}

/** Persist settings (mode 0600). Only call when a value changes. */
export function saveMcpSettings(settings: McpSettings): void {
  const file = settingsFilePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(settings, null, 2), { mode: 0o600 });
  try {
    chmodSync(file, 0o600);
  } catch {
    // best-effort
  }
}

/**
 * Port precedence: OPENREEL_MCP_PORT when set and numeric (including 0 for
 * tests), otherwise the settings file, otherwise 45190.
 */
export function resolveMcpPort(settings: McpSettings): number {
  const env = process.env.OPENREEL_MCP_PORT;
  if (env !== undefined && env !== "") {
    const parsed = Number(env);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 65535) return parsed;
  }
  return settings["mcp.port"];
}

/** Private-fetch switch: the setting, or the process override env var. */
export function resolveAllowPrivateFetch(settings: McpSettings): boolean {
  return (
    settings["mcp.allowPrivateFetch"] === true ||
    process.env.OPENREEL_ALLOW_LOCAL_FETCH === "1"
  );
}

/** Expanded (absolute) import roots for containment checks. */
export function expandedImportRoots(settings: McpSettings): string[] {
  return settings["mcp.importRoots"]
    .map((root) =>
      root === "$HOME" ? os.homedir() : root,
    )
    .map((root) => path.normalize(root));
}
