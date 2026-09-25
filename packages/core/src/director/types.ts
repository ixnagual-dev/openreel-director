export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface DirectorProjectState {
  readonly schemaVersion: 1;
  readonly extensions?: Readonly<Record<string, JsonValue>>;
}
