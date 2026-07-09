import { describe, expect, it } from "vitest";
import { sortingStateParser } from "./parsers";

describe("sortingStateParser", () => {
  it("parses a multi-column sort string", () => {
    expect(sortingStateParser.parse("user.asc,createdAt.desc")).toEqual([
      { id: "user", desc: false },
      { id: "createdAt", desc: true },
    ]);
  });

  it("parses an empty value to an empty sorting state", () => {
    expect(sortingStateParser.parse("")).toEqual([]);
  });

  it("keeps dots inside column ids (splits on the last dot only)", () => {
    expect(sortingStateParser.parse("user.name.asc")).toEqual([
      { id: "user.name", desc: false },
    ]);
  });

  it("round-trips through serialize and parse", () => {
    const sorting = [
      { id: "email", desc: true },
      { id: "role", desc: false },
    ];
    const serialized = sortingStateParser.serialize(sorting);
    expect(serialized).toBe("email.desc,role.asc");
    expect(sortingStateParser.parse(serialized)).toEqual(sorting);
  });

  it("compares sorting states by value", () => {
    const { eq } = sortingStateParser;
    expect(eq([{ id: "a", desc: false }], [{ id: "a", desc: false }])).toBe(
      true
    );
    expect(eq([{ id: "a", desc: false }], [{ id: "a", desc: true }])).toBe(
      false
    );
    expect(eq([{ id: "a", desc: false }], [])).toBe(false);
  });
});
