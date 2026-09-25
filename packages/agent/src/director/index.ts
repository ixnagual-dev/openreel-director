import type { ToolModule } from "./catalog";
import { wp1aTools, wp1aReplacements } from "./wp1a";
import { wp1bTools, wp1bReplacements } from "./wp1b";
import { perceptionTools } from "./perception";
import { editorialTools } from "./editorial";
import { lintTools } from "./lint";
import { timelineTools } from "./timeline";
import { revisionTools } from "./revisions";

export const DIRECTOR_TOOL_MODULES: readonly ToolModule[] = [
  { name: "wp1a", tools: wp1aTools, replacements: wp1aReplacements },
  { name: "wp1b", tools: wp1bTools, replacements: wp1bReplacements },
  { name: "perception", tools: perceptionTools },
  { name: "editorial", tools: editorialTools },
  { name: "lint", tools: lintTools },
  { name: "timeline", tools: timelineTools },
  { name: "revisions", tools: revisionTools },
];
