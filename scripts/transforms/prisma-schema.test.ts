import { describe, expect, it } from "vitest";
import { setPrismaRuntime } from "./prisma-schema";

const SCHEMA = `generator client {
  provider      = "prisma-client"
  output        = "../generated/client"
  runtime       = "workerd"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

generator clientNode {
  provider = "prisma-client"
  output   = "../generated/client-node"
}

datasource db {
  provider = "postgresql"
}
`;

describe("setPrismaRuntime", () => {
  it("removes the runtime line for Node hosts", () => {
    const out = setPrismaRuntime(SCHEMA, null);
    expect(out).not.toContain("workerd");
    expect(out).toContain('provider      = "prisma-client"');
    expect(out).toContain("binaryTargets");
  });

  it("keeps the schema unchanged for cloudflare", () => {
    expect(setPrismaRuntime(SCHEMA, "workerd")).toBe(SCHEMA);
  });

  it("is idempotent when the line is already gone", () => {
    const once = setPrismaRuntime(SCHEMA, null);
    expect(setPrismaRuntime(once, null)).toBe(once);
  });

  it("leaves the clientNode generator untouched for Node hosts", () => {
    const out = setPrismaRuntime(SCHEMA, null);
    expect(out).toContain("generator clientNode");
    expect(out).toContain('output   = "../generated/client-node"');
  });

  it("leaves the clientNode generator untouched for cloudflare", () => {
    const out = setPrismaRuntime(SCHEMA, "workerd");
    expect(out).toContain("generator clientNode");
    expect(out).toContain('output   = "../generated/client-node"');
  });
});
