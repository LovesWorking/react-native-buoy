/** Return a concise string describing the JavaScript type of the provided value. */
export function getValueTypeLabel(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";

  const type = typeof value;
  if (type === "object") return "object";
  if (type === "boolean") return "boolean";
  if (type === "number") return "number";
  if (type === "string") return "string";

  return "unknown";
}
