/**
 * JSON Schema constants for the editorial object-typed tool params.
 *
 * Source of truth for the shapes is `packages/core/src/types/timeline.ts`
 * (plus the text types). These are hand-written — not generated from
 * TypeScript — and imported by the agent registry so every object param on
 * the editorial catalog carries a full schema. All objects are closed
 * (`additionalProperties: false`).
 */

export interface JsonSchema {
  readonly type?: string;
  readonly properties?: Record<string, JsonSchema>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly items?: JsonSchema;
  readonly enum?: readonly string[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number;
  readonly exclusiveMaximum?: number;
  readonly minProperties?: number;
  readonly description?: string;
  readonly [key: string]: unknown;
}

/** `Transform` (timeline.ts). Closed; at least one property when used. */
export const CLIP_TRANSFORM_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    position: {
      type: "object",
      additionalProperties: false,
      properties: { x: { type: "number" }, y: { type: "number" } },
    },
    scale: {
      type: "object",
      additionalProperties: false,
      properties: { x: { type: "number" }, y: { type: "number" } },
    },
    rotation: { type: "number", description: "Degrees clockwise." },
    anchor: {
      type: "object",
      additionalProperties: false,
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
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        z: { type: "number" },
      },
      required: ["x", "y", "z"],
    },
    perspective: { type: "number", minimum: 0 },
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

/** `Clip.stabilization` (timeline.ts). */
export const CLIP_STABILIZATION_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    enabled: { type: "boolean" },
    strength: { type: "number", minimum: 0, maximum: 1 },
    cropMode: { type: "string", enum: ["auto", "none"] },
  },
};

/** `ChromaKeySettings` (timeline.ts). */
export const CLIP_CHROMA_KEY_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
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

const SPEED_KEYFRAME_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    time: { type: "number" },
    speed: { type: "number" },
    easing: { type: "string" },
  },
  required: ["time", "speed"],
};

/** `SpeedKeyframe[]` (timeline.ts). */
export const SPEED_KEYFRAMES_SCHEMA: JsonSchema = {
  type: "array",
  items: SPEED_KEYFRAME_SCHEMA,
};

/** `FreezeFrame[]` (timeline.ts). */
export const FREEZE_FRAMES_SCHEMA: JsonSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      clipId: { type: "string" },
      sourceTime: { type: "number" },
      startTime: { type: "number" },
      duration: { type: "number" },
    },
    required: ["sourceTime", "startTime", "duration"],
  },
};

/** Effect params bag: values are number, boolean, or string. */
export const EFFECT_PARAMS_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    shaderId: { type: "string" },
  },
  additionalProperties: { type: ["number", "boolean", "string"] } as unknown as boolean,
};

/** `Effect` (timeline.ts). */
export const AUDIO_EFFECT_SCHEMA: JsonSchema = {
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

/** Audio effect params bag (same value union as video params). */
export const AUDIO_EFFECT_PARAMS_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: { type: ["number", "boolean", "string"] } as unknown as boolean,
};

/** `SubtitleStyle` (timeline.ts). */
export const SUBTITLE_STYLE_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    fontFamily: { type: "string" },
    fontSize: { type: "number", minimum: 1 },
    color: { type: "string" },
    backgroundColor: { type: "string" },
    position: { type: "string", enum: ["top", "center", "bottom"] },
    highlightColor: { type: "string" },
    upcomingColor: { type: "string" },
  },
};

/** `Partial<Marker>` (timeline.ts). */
export const MARKER_UPDATES_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    time: { type: "number", minimum: 0 },
    label: { type: "string" },
    color: { type: "string" },
  },
};

/** `TextStyle` (text/types.ts): all fields optional at the tool boundary. */
export const TEXT_STYLE_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    fontFamily: { type: "string" },
    fontSize: { type: "number", minimum: 1 },
    fontWeight: { type: ["string", "number"] } as unknown as JsonSchema,
    fontStyle: { type: "string", enum: ["normal", "italic"] },
    color: { type: "string" },
    backgroundColor: { type: "string" },
    strokeColor: { type: "string" },
    strokeWidth: { type: "number", minimum: 0 },
    shadowColor: { type: "string" },
    shadowBlur: { type: "number", minimum: 0 },
    shadowOffsetX: { type: "number" },
    shadowOffsetY: { type: "number" },
    textAlign: { type: "string" },
    verticalAlign: { type: "string" },
    lineHeight: { type: "number", exclusiveMinimum: 0 },
    letterSpacing: { type: "number" },
    textDecoration: { type: "string" },
  },
};

/** Text clip payload for create_text_clip. */
export const TEXT_CLIP_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string" },
    startTime: { type: "number", minimum: 0 },
    duration: { type: "number", exclusiveMinimum: 0 },
    trackId: { type: "string" },
    style: TEXT_STYLE_SCHEMA,
    animation: { type: ["string", "object"] } as unknown as JsonSchema,
  },
  required: ["text"],
};

/** Text clip updates for update_text_clip. */
export const TEXT_CLIP_UPDATES_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    text: { type: "string" },
    style: TEXT_STYLE_SCHEMA,
    transform: CLIP_TRANSFORM_SCHEMA,
    animation: { type: ["string", "object"] } as unknown as JsonSchema,
    animationInSec: { type: "number", minimum: 0 },
    animationOutSec: { type: "number", minimum: 0 },
  },
};

/** Keyframe value: a number, or an {x,y} pair for vec2 properties. */
export const KEYFRAME_VALUE_SCHEMA: JsonSchema = {
  description:
    "Keyframe value matching the property: a number, or {x, y} for vec2 properties.",
};

/** Keyframe list for set_clip_keyframes. */
export const CLIP_KEYFRAMES_SCHEMA: JsonSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      time: { type: "number" },
      property: { type: "string" },
      value: KEYFRAME_VALUE_SCHEMA,
      easing: { type: "string" },
    },
    required: ["time", "property"],
  },
};

/** Audio automation points for add_audio_automation. */
export const AUDIO_AUTOMATION_POINTS_SCHEMA: JsonSchema = {
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
export const EFFECT_ORDER_SCHEMA: JsonSchema = {
  type: "array",
  items: { type: "string" },
};

/** `ClipColorGrading` (video/color-grading-engine.ts). */
const RGB_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    r: { type: "number" },
    g: { type: "number" },
    b: { type: "number" },
  },
  required: ["r", "g", "b"],
};

const CURVE_POINTS_SCHEMA: JsonSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: { x: { type: "number" }, y: { type: "number" } },
    required: ["x", "y"],
  },
};

export const COLOR_GRADING_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    temperature: { type: "number" },
    tint: { type: "number" },
    colorWheels: {
      type: "object",
      additionalProperties: false,
      properties: {
        shadows: RGB_SCHEMA,
        midtones: RGB_SCHEMA,
        highlights: RGB_SCHEMA,
        shadowsLift: { type: "number" },
        midtonesGamma: { type: "number" },
        highlightsGain: { type: "number" },
      },
    },
    curves: {
      type: "object",
      additionalProperties: false,
      properties: {
        rgb: CURVE_POINTS_SCHEMA,
        red: CURVE_POINTS_SCHEMA,
        green: CURVE_POINTS_SCHEMA,
        blue: CURVE_POINTS_SCHEMA,
      },
    },
    hsl: {
      type: "object",
      additionalProperties: false,
      properties: {
        hue: { type: "array", items: { type: "number" } },
        saturation: { type: "array", items: { type: "number" } },
        luminance: { type: "array", items: { type: "number" } },
      },
    },
    lut: {
      type: "object",
      additionalProperties: false,
      properties: {
        data: { type: "array", items: { type: "number" } },
        size: { type: "number" },
        intensity: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["data", "size"],
    },
  },
};

/** Clipboard for batch_actions. */
export const BATCH_ACTIONS_SCHEMA: JsonSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      tool: { type: "string" },
      args: { type: "object" },
    },
    required: ["tool"],
  },
};
