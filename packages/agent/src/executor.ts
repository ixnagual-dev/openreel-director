import type { EditingHost } from "./host";
import type { ToolResult } from "./types";
import { getTool } from "./registry";
import { resolveClipId } from "./serialize";

/**
 * Resolve agent-friendly clip references (clipIndex / atSec [+ trackIndex]) to a
 * canonical clipId so the model never has to juggle UUIDs. Leaves an explicit
 * clipId untouched.
 */
function resolveRefs(
  args: Record<string, unknown>,
  host: EditingHost,
): Record<string, unknown> {
  if (typeof args.clipId === "string") return args;
  const hasRef =
    typeof args.clipIndex === "number" || typeof args.atSec === "number";
  if (!hasRef) return args;
  try {
    const id = resolveClipId(host.getProject(), {
      index: args.clipIndex as number | undefined,
      atSec: args.atSec as number | undefined,
      trackIndex: args.trackIndex as number | undefined,
    });
    if (id) return { ...args, clipId: id };
  } catch {
    // no open project / resolution failed — let the tool report it
  }
  return args;
}

export async function executeTool(
  name: string,
  args: Record<string, unknown> | undefined,
  host: EditingHost,
): Promise<ToolResult> {
  const tool = getTool(name);
  if (!tool) {
    return {
      ok: false,
      summary: `Unknown tool: ${name}`,
      error: { code: "UNKNOWN_TOOL", message: `No tool named '${name}'`, hint: "Use a registered tool name from the current tool catalog." },
    };
  }
  const resolved = resolveRefs(args ?? {}, host);
  try {
    return await tool.handler(resolved, host);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed";
    const typed = error as { code?: string; entityId?: string; hint?: string };
    return { ok: false, summary: message, error: { code: typed.code ?? "INTERNAL_ERROR", message, hint: typed.hint ?? "Inspect the project state and supplied arguments, then retry.", ...(typed.entityId ? { entityId: typed.entityId } : {}) } };
  }
}

export function isDestructive(name: string): boolean {
  return getTool(name)?.destructive ?? false;
}

export function isExpensive(name: string): boolean {
  return getTool(name)?.expensive ?? false;
}
