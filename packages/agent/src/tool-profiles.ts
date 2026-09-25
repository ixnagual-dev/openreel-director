import type { RegisteredTool } from "./registry";
import type { ToolProfile } from "./host";

export { type ToolProfile };

export const TOOL_PROFILES: readonly ToolProfile[] = [
  "editorial",
  "motion",
  "creation",
  "all",
] as const;

export function isToolProfile(value: unknown): value is ToolProfile {
  return (
    value === "editorial" ||
    value === "motion" ||
    value === "creation" ||
    value === "all"
  );
}

/**
 * Editorial allow-list: timeline, media, audio, subtitles, markers,
 * transitions, keyframes, export, plus the meta tools. 83 tools (≤ 100),
 * leaving headroom for later perception and lint tools.
 *
 * Dropped on purpose (still on `all`): graphics tools, `execute_action`,
 * all `multicam` tools, motion-domain tools, creation reads, and the
 * motion export/queue tools. Adding a tool means editing this list and
 * the equality test in `registry.wp1b.test.ts`.
 */
export const EDITORIAL_TOOLS: readonly string[] = [
  "get_editor_state",
  "list_media",
  "list_tracks",
  "list_clips",
  "get_clip",
  "get_capabilities",
  "create_project",
  "list_projects",
  "open_project",
  "save_project",
  "update_project_settings",
  "rename_project",
  "set_canvas_background",
  "import_media_from_url",
  "import_media_from_path",
  "import_media_folder",
  "delete_media",
  "rename_media",
  "add_track",
  "duplicate_track",
  "remove_track",
  "rename_track",
  "reorder_track",
  "lock_track",
  "hide_track",
  "mute_track",
  "solo_track",
  "consolidate_track",
  "add_clip",
  "remove_clip",
  "move_clip",
  "trim_clip",
  "split_clip",
  "ripple_delete_clip",
  "slip_clip",
  "slide_clip",
  "roll_edit",
  "trim_to_playhead",
  "close_gap",
  "close_gaps",
  "set_clip_transform",
  "set_clip_blend_mode",
  "set_clip_blend_opacity",
  "add_video_effect",
  "remove_video_effect",
  "update_video_effect",
  "toggle_video_effect",
  "set_effect_order",
  "set_color_grading",
  "set_clip_speed",
  "set_clip_reverse",
  "set_clip_pitch_correction",
  "set_speed_ramp",
  "set_clip_stabilization",
  "set_clip_chroma_key",
  "set_clip_volume",
  "set_clip_fade",
  "add_audio_automation",
  "add_audio_effect",
  "remove_audio_effect",
  "update_audio_effect",
  "toggle_audio_effect",
  "create_text_clip",
  "update_text_clip",
  "remove_text_clip",
  "add_subtitle",
  "remove_subtitle",
  "update_subtitle",
  "import_srt",
  "set_subtitle_style",
  "add_transition",
  "update_transition",
  "remove_transition",
  "add_keyframe",
  "remove_keyframe",
  "set_clip_keyframes",
  "add_marker",
  "remove_marker",
  "update_marker",
  "export_video",
  "export_audio",
  "batch_actions",
  "set_tool_profile",
];

/**
 * Creation predicate (same idea as `isCreationTool` in tool-router.ts):
 * name or title matches creation/3d/scene3d/gltf/glb/rigging/humanoid or
 * "product cinematic".
 */
export function isCreationToolName(
  name: string,
  title: string,
  description: string,
): boolean {
  const haystack = `${name} ${title} ${description}`;
  return /creation|3d|scene3d|gltf|glb|rigging|humanoid|product cinematic/i.test(
    haystack,
  );
}

const MOTION_READ_TOOLS: readonly string[] = [
  "list_motion_compositions",
  "get_motion_composition",
  "list_motion_animatable_properties",
];

const MOTION_EXPORT_TOOLS: readonly string[] = [
  "export_motion_video",
  "queue_motion_render",
  "run_motion_render_queue",
  "list_motion_render_queue",
  "cancel_motion_render_item",
];

/** Filter a registry snapshot down to one profile. */
export function toolsForProfile(
  profile: ToolProfile,
  tools: readonly RegisteredTool[],
): RegisteredTool[] {
  switch (profile) {
    case "all":
      return [...tools];
    case "editorial": {
      const wanted = new Set(EDITORIAL_TOOLS);
      return tools.filter((tool) => wanted.has(tool.name));
    }
    case "motion":
      return tools.filter(
        (tool) =>
          tool.name === "set_tool_profile" ||
          MOTION_READ_TOOLS.includes(tool.name) ||
          MOTION_EXPORT_TOOLS.includes(tool.name) ||
          (tool.domain === "motion" &&
            !isCreationToolName(tool.name, tool.title, tool.description)),
      );
    case "creation":
      return tools.filter(
        (tool) =>
          tool.name === "set_tool_profile" ||
          (tool.name !== "set_tool_profile" &&
            isCreationToolName(tool.name, tool.title, tool.description)),
      );
  }
}
