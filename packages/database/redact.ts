const MAX_DEPTH = 8;

export function argShape(value: unknown, depth = 0): unknown {
  if (value === null) {
    return null;
  }

  if (depth >= MAX_DEPTH) {
    return "…";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? [argShape(value[0], depth + 1)] : [];
  }

  if (value instanceof Date) {
    return "Date";
  }

  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    return "bytes";
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        argShape(entry, depth + 1),
      ])
    );
  }

  return typeof value;
}
