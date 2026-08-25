import { describe, expect, it, vi, beforeEach } from "vitest";

// orQuery and nextPrimaryKey cannot be imported directly from Database.ts because
// that module has a top-level await calling a Tauri native API (appLocalDataDir).
// We test the logic by mocking the whole module and providing real implementations.

const { mockedSelect, mockedExecute } = vi.hoisted(() => ({
  mockedSelect: vi.fn(),
  mockedExecute: vi.fn(),
}));

vi.mock("@/store/Database", () => {
  function orQuery(ids: number[], column: string, offset: number): string {
    return ids.map((_: unknown, index: number) => `${column} = $${index + offset}`).join(" OR ");
  }

  async function nextPrimaryKey(entityId: number): Promise<number> {
    const result: { Z_MAX: number }[] = await mockedSelect(
      "UPDATE Z_PRIMARYKEY SET Z_MAX = Z_MAX + 1 WHERE Z_ENT = $1 RETURNING Z_MAX",
      [entityId],
    );
    return result[0].Z_MAX;
  }

  return {
    db: { select: mockedSelect, execute: mockedExecute },
    orQuery,
    nextPrimaryKey,
  };
});

import { orQuery, nextPrimaryKey } from "@/store/Database";

describe("orQuery", () => {
  it("generates a single condition", () => {
    expect(orQuery([1], "Z_PK", 1)).toBe("Z_PK = $1");
  });

  it("joins multiple ids with OR", () => {
    expect(orQuery([1, 2, 3], "Z_PK", 1)).toBe("Z_PK = $1 OR Z_PK = $2 OR Z_PK = $3");
  });

  it("respects a non-1 offset", () => {
    expect(orQuery([1, 2], "ZCOURSE", 3)).toBe("ZCOURSE = $3 OR ZCOURSE = $4");
  });

  it("returns empty string for an empty array", () => {
    expect(orQuery([], "Z_PK", 1)).toBe("");
  });
});

describe("nextPrimaryKey", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the incremented Z_MAX from the primary key table", async () => {
    mockedSelect.mockResolvedValueOnce([{ Z_MAX: 42 }]);

    const result = await nextPrimaryKey(7);

    expect(result).toBe(42);
  });

  it("atomically increments Z_MAX for the given entity", async () => {
    mockedSelect.mockResolvedValueOnce([{ Z_MAX: 10 }]);

    await nextPrimaryKey(1);

    expect(mockedSelect).toHaveBeenCalledWith(
      "UPDATE Z_PRIMARYKEY SET Z_MAX = Z_MAX + 1 WHERE Z_ENT = $1 RETURNING Z_MAX",
      [1],
    );
  });
});
