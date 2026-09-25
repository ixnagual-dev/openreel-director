import type { RegisteredTool } from "../registry";

export interface ToolModule {
  readonly name: string;
  readonly tools: readonly RegisteredTool[];
  readonly replacements?: Readonly<Record<string, (legacy: RegisteredTool) => RegisteredTool>>;
}

export function composeToolRegistry(legacy: readonly RegisteredTool[], modules: readonly ToolModule[]): RegisteredTool[] {
  const names = new Set<string>();
  for (const tool of legacy) {
    if (names.has(tool.name)) throw new Error(`Duplicate legacy tool name: ${tool.name}`);
    names.add(tool.name);
  }
  const replacements = new Map<string, (legacy: RegisteredTool) => RegisteredTool>();
  for (const module of modules) for (const [name, replacement] of Object.entries(module.replacements ?? {})) {
    if (replacements.has(name)) throw new Error(`Conflicting replacement for tool: ${name}`);
    if (!names.has(name)) throw new Error(`Replacement targets undeclared tool: ${name}`);
    replacements.set(name, replacement);
  }
  const seenAdditions = new Set<string>();
  const additions: RegisteredTool[] = [];
  for (const module of modules) for (const tool of module.tools) {
    if (names.has(tool.name) || seenAdditions.has(tool.name)) throw new Error(`Duplicate tool addition: ${tool.name}`);
    seenAdditions.add(tool.name); additions.push(tool);
  }
  return [...legacy.map((tool) => replacements.get(tool.name)?.(tool) ?? tool), ...additions];
}
