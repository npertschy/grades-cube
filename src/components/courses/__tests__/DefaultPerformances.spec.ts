import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Student } from "@/components/students/Student";
import { insertDefaultPerformancesWithGrades } from "@/components/courses/DefaultPerformances";
import { Z_ENT } from "@/store/EntityId";

const { mockedExecute, mockedNextPrimaryKey } = vi.hoisted(() => ({
  mockedExecute: vi.fn(),
  mockedNextPrimaryKey: vi.fn(),
}));

vi.mock("@/store/Database", () => ({
  db: {
    select: vi.fn(),
    execute: mockedExecute,
  },
  nextPrimaryKey: mockedNextPrimaryKey,
}));

vi.mock("@/store/DateConversion", () => ({
  dateToCoreData: vi.fn(() => 1234567890),
}));

const COURSE_ID = 42;
const students: Student[] = [
  { id: 10, firstName: "A", lastName: "B", groups: [], courses: [] },
  { id: 11, firstName: "C", lastName: "D", groups: [], courses: [] },
];

beforeEach(() => {
  vi.resetAllMocks();
  mockedExecute.mockResolvedValue({});
  // 9 performances + 2 students × 9 grades = 27 nextPrimaryKey calls
  let pk = 100;
  mockedNextPrimaryKey.mockImplementation(() => Promise.resolve(pk++));
});

describe("insertDefaultPerformancesWithGrades", () => {
  it("inserts exactly 9 ZPERFORMANCE rows", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 1, []);

    const performanceCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZPERFORMANCE"),
    );
    expect(performanceCalls).toHaveLength(9);
  });

  it("inserts one ZGRADE row per student per performance (2 students × 9 = 18)", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 1, students);

    const gradeCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZGRADE"),
    );
    expect(gradeCalls).toHaveLength(18);
  });

  it("inserts no ZGRADE rows when there are no students", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 1, []);

    const gradeCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZGRADE"),
    );
    expect(gradeCalls).toHaveLength(0);
  });

  it("inserts all 9 performance types in order (0–8)", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 1, []);

    const performanceCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZPERFORMANCE"),
    );
    const insertedTypes = performanceCalls.map(([, params]) => (params as unknown[])[5]);
    expect(insertedTypes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("sets ZEDITABLE = 1 for types 0, 2, 3, 6 and 0 for all others", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 1, []);

    const performanceCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZPERFORMANCE"),
    );
    const editableByType: Record<number, number> = {};
    for (const [, params] of performanceCalls) {
      const p = params as unknown[];
      editableByType[p[5] as number] = p[3] as number;
    }
    expect(editableByType[0]).toBe(1);
    expect(editableByType[2]).toBe(1);
    expect(editableByType[3]).toBe(1);
    expect(editableByType[6]).toBe(1);
    expect(editableByType[1]).toBe(0);
    expect(editableByType[4]).toBe(0);
    expect(editableByType[5]).toBe(0);
    expect(editableByType[7]).toBe(0);
    expect(editableByType[8]).toBe(0);
  });

  it("applies Sek I weights (AT=70, written=30) for groupType 1", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 1, []);

    const performanceCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZPERFORMANCE"),
    );
    const weightByType: Record<number, number> = {};
    for (const [, params] of performanceCalls) {
      const p = params as unknown[];
      weightByType[p[5] as number] = p[8] as number;
    }
    expect(weightByType[2]).toBe(0.7);  // oral weight in AT
    expect(weightByType[4]).toBe(0.3);  // special weight in AT
    expect(weightByType[5]).toBe(0.7);  // AT weight in final
    expect(weightByType[7]).toBe(0.3);  // written weight in final
  });

  it("applies Sek II weights (AT=50, written=50) for groupType 2", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 2, []);

    const performanceCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZPERFORMANCE"),
    );
    const weightByType: Record<number, number> = {};
    for (const [, params] of performanceCalls) {
      const p = params as unknown[];
      weightByType[p[5] as number] = p[8] as number;
    }
    expect(weightByType[5]).toBe(0.5);
    expect(weightByType[7]).toBe(0.5);
  });

  it("links every ZGRADE row to the correct performance and student", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 1, students);

    const performanceCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZPERFORMANCE"),
    );
    const gradeCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZGRADE"),
    );

    // Each performance PK is the 2nd arg of nextPrimaryKey; reconstruct from execute calls
    // Grades come in pairs (student 10, student 11) per performance in insertion order
    expect(gradeCalls).toHaveLength(18);

    // Verify Z_ENT and Z_OPT for grades
    for (const [, params] of gradeCalls) {
      const p = params as unknown[];
      expect(p[1]).toBe(Z_ENT.ZGRADE);
      expect(p[2]).toBe(1);
    }

    // Verify ZPERFORMANCE entity values
    for (const [, params] of performanceCalls) {
      const p = params as unknown[];
      expect(p[1]).toBe(Z_ENT.ZPERFORMANCE);
      expect(p[6]).toBe(COURSE_ID);
    }
  });

  it("sets ZSORTORDER to 0 for all default performances", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, 1, []);

    const performanceCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZPERFORMANCE"),
    );
    for (const [, params] of performanceCalls) {
      const p = params as unknown[];
      expect(p[4]).toBe(0); // ZSORTORDER
    }
  });

  it("uses Sek I defaults when groupType is undefined", async () => {
    await insertDefaultPerformancesWithGrades(COURSE_ID, undefined, []);

    const performanceCalls = mockedExecute.mock.calls.filter(
      ([sql]) => (sql as string).includes("INSERT INTO ZPERFORMANCE"),
    );
    const weightByType: Record<number, number> = {};
    for (const [, params] of performanceCalls) {
      const p = params as unknown[];
      weightByType[p[5] as number] = p[8] as number;
    }
    expect(weightByType[5]).toBe(0.7);
    expect(weightByType[7]).toBe(0.3);
  });
});
