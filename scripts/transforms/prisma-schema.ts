const RUNTIME_REGEX = /^\s*runtime\s*=\s*"workerd"\s*\r?\n/m;

export function setPrismaRuntime(
  schema: string,
  runtime: "workerd" | null
): string {
  if (runtime === "workerd") {
    return schema;
  }
  return schema.replace(RUNTIME_REGEX, "");
}
