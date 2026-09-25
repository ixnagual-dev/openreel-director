/**
 * WP1b editorial JSON Schemas. Source of truth for the TypeScript types is
 * packages/core/src/types/timeline.ts (Transform) and the sibling modules
 * noted below. The registry imports these constants so every object-typed
 * editorial param carries a full JSON Schema instead of a bare
 * `{ "type": "object" }`.
 *
 * Objects that stay open bags (video/audio effect params) use an explicit
 * value union with additionalProperties rather than no properties at all.
 */

import type { JSONSchema } from "./json-schema";

/** Closed schema for the clip Transform object (timeline.ts). */
export const CLIP_TRANSFORM_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    position: {
      type: "object",
      additionalProperties: false,
      description:
        "Offset pixels from center for video/image clips (default 0,0); normalized 0..1 of the canvas for text/shape/svg/sticker.",
      properties: { x: { type: "number" }, y: { type: "number" } },
    },
    scale: {
      type: "object",
      additionalProperties: false,
      description: "Multiplier. 1 is 100%.",
      properties: { x: { type: "number" }, y: { type: "number" } },
    },
    rotation: { type: "number", description: "Degrees clockwise." },
    anchor: {
      type: "object",
      additionalProperties: false,
      description: "Normalized 0..1. Default 0.5, 0.5.",
      properties: {
        x: { type: "number", minimum: 0, maximum: 1 },
        y: { type: "number", minimum: 0, maximum: 1 },
      },
    },
    opacity: { type: "number", minimum: 0, maximum: 1 },
    borderRadius: { type: "number", minimum: 0, description: "Pixels." },
    fitMode: { type: "string", enum: ["cover", "contain", "stretch", "none"] },
    rotate3d: {
      type: "object",
      additionalProperties: false,
      description: "Degrees per axis.",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        z: { type: "number" },
      },
      required: ["x", "y", "z"],
    },
    perspective: { type: "number", minimum: 0, description: "Pixels, >= 0." },
    transformStyle: { type: "string", enum: ["flat", "preserve-3d"] },
    crop: {
      type: "object",
      additionalProperties: false,
      description:
        "Normalized source crop. Full frame is x=0,y=0,width=1,height=1.",
      properties: {
        x: { type: "number", minimum: 0, maximum: 1 },
        y: { type: "number", minimum: 0, maximum: 1 },
        width: { type: "number", exclusiveMinimum: 0, maximum: 1 },
        height: { type: "number", exclusiveMinimum: 0, maximum: 1 },
      },
      required: ["x", "y", "width", "height"],
    },
  },
};

/** Clip.stabilization (timeline.ts). */
export const CLIP_STABILIZATION_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    enabled: { type: "boolean" },
    strength: { type: "number", minimum: 0, maximum: 1 },
    cropMode: { type: "string", enum: ["auto", "none"] },
    profile: { type: "string" },
  },
};

/** ChromaKeySettings (timeline.ts). */
export const CLIP_CHROMA_KEY_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    enabled: { type: "boolean" },
    keyColor: {
      type: "object",
      additionalProperties: false,
      properties: {
        r: { type: "number", minimum: 0, maximum: 255 },
        g: { type: "number", minimum: 0, maximum: 255 },
        b: { type: "number", minimum: 0, maximum: 255 },
      },
      required: ["r", "g", "b"],
    },
    tolerance: { type: "number", minimum: 0, maximum: 1 },
    edgeSoftness: { type: "number", minimum: 0, maximum: 1 },
    spillSuppression: { type: "number", minimum: 0, maximum: 1 },
  },
};

/** SpeedKeyframe[] (timeline.ts). */
export const SPEED_KEYFRAMES_SCHEMA: JSONSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      time: { type: "number", minimum: 0 },
      speed: { type: "number", exclusiveMinimum: 0 },
      easing: { type: "string" },
    },
    required: ["time", "speed"],
  },
};

/** FreezeFrame[] (timeline.ts). */
export const FREEZE_FRAMES_SCHEMA: JSONSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      clipId: { type: "string" },
      sourceTime: { type: "number", minimum: 0 },
      startTime: { type: "number", minimum: 0 },
      duration: { type: "number", exclusiveMinimum: 0 },
    },
    required: ["sourceTime", "startTime", "duration"],
  },
};

/**
 * Open bag for video/audio effect params: effect types vary, so keys stay
 * open but values are constrained to the scalar union.
 */
export const EFFECT_PARAMS_SCHEMA: JSONSchema = {
  type: "object",
  description:
    "Effect params vary by effect type. Values are numbers, booleans, or strings; shader effects also take a shaderId string.",
  properties: {
    shaderId: { type: "string" },
  },
  additionalProperties: {
    anyOf: [{ type: "number" }, { type: "boolean" }, { type: "string" }],
  },
};

/** ClipColorGrading (video/color-grading-engine). */
export const COLOR_GRADING_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  description: "Wheels/curves/LUT/HSL/temperature/tint grading for a clip.",
  properties: {
    exposure: { type: "number" },
    contrast: { type: "number" },
    saturation: { type: "number" },
    temperature: { type: "number" },
    tint: { type: "number" },
    highlights: {
      type: "object",
      additionalProperties: false,
      properties: {
        r: { type: "number" },
        g: { type: "number" },
        b: { type: "number" },
      },
    },
    midtones: {
      type: "object",
      additionalProperties: false,
      properties: {
        r: { type: "number" },
        g: { type: "number" },
        b: { type: "number" },
      },
    },
    shadows: {
      type: "object",
      additionalProperties: false,
      properties: {
        r: { type: "number" },
        g: { type: "number" },
        b: { type: "number" },
      },
    },
    lut: { type: "string" },
    intensity: { type: "number", minimum: 0, maximum: 1 },
  },
};

/** Effect (timeline.ts) for add_audio_effect. */
export const AUDIO_EFFECT_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    type: { type: "string" },
    params: EFFECT_PARAMS_SCHEMA,
    enabled: { type: "boolean" },
  },
  required: ["type"],
};

/** SubtitleStyle (timeline.ts) for set_subtitle_style. */
export const SUBTITLE_STYLE_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    fontFamily: { type: "string" },
    fontSize: { type: "number", exclusiveMinimum: 0 },
    bold: { type: "boolean" },
    italic: { type: "boolean" },
    color: { type: "string" },
    backgroundColor: { type: "string" },
    backgroundOpacity: { type: "number", minimum: 0, maximum: 1 },
    position: {
      type: "string",
      enum: ["top", "center", "bottom"],
    },
    outlineColor: { type: "string" },
    outlineWidth: { type: "number", minimum: 0 },
    shadow: { type: "boolean" },
  },
};

/** Partial<Marker> (timeline.ts) for update_marker. */
export const MARKER_UPDATES_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    time: { type: "number", minimum: 0 },
    label: { type: "string" },
    color: { type: "string" },
  },
};

/** Text style bag for text clips. */
export const TEXT_STYLE_BAG_SCHEMA: JSONSchema = {
  type: "object",
  description: "Text style key/value pairs (font, size, color, ...).",
  additionalProperties: {
    anyOf: [{ type: "number" }, { type: "boolean" }, { type: "string" }],
  },
};

/** Text entrance/exit animation for text clips. */
export const TEXT_ANIMATION_SCHEMA: JSONSchema = {
  anyOf: [
    { type: "string" },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { type: "string" },
        preset: { type: "string" },
      },
    },
  ],
};

/** TextClip (text/types) for create/update_text_clip. */
export const TEXT_CLIP_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string" },
    startTime: { type: "number", minimum: 0 },
    duration: { type: "number", exclusiveMinimum: 0 },
    trackId: { type: "string" },
    style: TEXT_STYLE_BAG_SCHEMA,
    animation: TEXT_ANIMATION_SCHEMA,
  },
};

/** Text clip partial updates for update_text_clip. */
export const TEXT_CLIP_UPDATES_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    text: { type: "string" },
    startTime: { type: "number", minimum: 0 },
    duration: { type: "number", exclusiveMinimum: 0 },
    style: TEXT_STYLE_BAG_SCHEMA,
    transform: CLIP_TRANSFORM_SCHEMA,
    animation: TEXT_ANIMATION_SCHEMA,
    animationInSec: { type: "number", minimum: 0 },
    animationOutSec: { type: "number", minimum: 0 },
  },
};

/**
 * add_keyframe value: matches the animated property (number, or {x,y} for a
 * vec2). Kept as an anyOf with a description so it is never a bare object.
 */
export const KEYFRAME_VALUE_SCHEMA: JSONSchema = {
  description:
    "Keyframe value matching the property: a number, or {x,y} for vec2 properties (e.g. position, scale).",
  anyOf: [
    { type: "number" },
    { type: "string" },
    { type: "boolean" },
    {
      type: "object",
      additionalProperties: false,
      properties: { x: { type: "number" }, y: { type: "number" } },
      required: ["x", "y"],
    },
  ],
};

/** Keyframe entries for set_clip_keyframes (timeline.ts Keyframe). */
export const KEYFRAME_ENTRIES_SCHEMA: JSONSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      time: { type: "number", minimum: 0 },
      property: { type: "string" },
      value: KEYFRAME_VALUE_SCHEMA,
      easing: { type: "string" },
    },
    required: ["time", "property"],
  },
};

/** Audio automation points for add_audio_automation (AutomationPoint). */
export const AUTOMATION_POINTS_SCHEMA: JSONSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      time: { type: "number", minimum: 0 },
      value: { type: "number" },
    },
    required: ["time", "value"],
  },
};

/** Effect-id list for set_effect_order. */
export const EFFECT_ID_LIST_SCHEMA: JSONSchema = {
  type: "array",
  items: { type: "string" },
};
