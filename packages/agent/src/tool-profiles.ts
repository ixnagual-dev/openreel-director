/**
 * WP1b §1.6 tool profiles. The profile filters MCP `tools/list` only;
 * `tools/call` still executes any registered name, and in-app chat routing
 * (tool-router.ts) is unchanged.
 */

export const TOOL_PROFILES = ["editorial", "motion", "creation", "all"] as const;

export type ToolProfile = (typeof TOOL_PROFILES)[number];

export function isToolProfile(value: unknown): value is ToolProfile {
  return (
    typeof value === "string" &&
    (TOOL_PROFILES as readonly string[]).includes(value)
  );
}

export function unknownProfileMessage(value: unknown): string {
  return `Unknown tool profile: ${String(value)}. Expected editorial, motion, creation, or all.`;
}

/**
 * Editorial allow-list — 83 tools. Headroom of 17 under the ≤100 cap for
 * later perception and lint tools. Adding a tool means editing this list
 * and the equality test.
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

/** Motion-domain read tools included in the motion profile. */
export const MOTION_READ_TOOLS: readonly string[] = [
  "list_motion_compositions",
  "get_motion_composition",
  "list_motion_animatable_properties",
];

/** Motion export tools included in the motion profile. */
export const MOTION_EXPORT_TOOLS: readonly string[] = [
  "export_motion_video",
  "queue_motion_render",
  "run_motion_render_queue",
  "list_motion_render_queue",
  "cancel_motion_render_item",
];

export interface ProfileToolView {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly domain: string;
}

/**
 * Creation predicate (same idea as isCreationTool in tool-router.ts): name
 * or title matches creation/3d/scene3d/gltf/glb/rigging/humanoid/product
 * cinematic, including the probe/inspect/rig and get/list/render/export
 * creation reads.
 */
export function isCreationToolView(tool: ProfileToolView): boolean {
  const haystack = `${tool.name} ${tool.title} ${tool.description}`;
  return /creation|3d|scene3d|gltf|glb|rigging|humanoid|product cinematic/i.test(haystack);
}

/** Motion profile minus the always-appended set_tool_profile. */
export function isMotionToolView(tool: ProfileToolView): boolean {
  if (tool.name === "set_tool_profile") return true;
  if (
    (MOTION_READ_TOOLS as readonly string[]).includes(tool.name) ||
    (MOTION_EXPORT_TOOLS as readonly string[]).includes(tool.name)
  ) {
    return true;
  }
  return tool.domain === "motion" && !isCreationToolView(tool);
}

/** Sticky-profile store for hosts that have no main process (headless). */
let currentProfile: ToolProfile = "editorial";

export function getCurrentProfile(): ToolProfile {
  return currentProfile;
}

export function setCurrentProfile(profile: ToolProfile): void {
  currentProfile = profile;
}
