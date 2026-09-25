/**
 * Minimal JSON Schema type shared by core schema constants. Mirrors the
 * agent package's JSONSchema alias without creating a core → agent import.
 */
export type JSONSchema = Record<string, unknown>;
