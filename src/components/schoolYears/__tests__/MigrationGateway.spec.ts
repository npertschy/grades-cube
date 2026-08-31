import type { SchoolYearMigrationPlan } from "@/components/schoolYears/Migration";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import {
  loadMigratableCourses,
  loadMigratableGroups,
  migrateSchoolYear,
} from "@/components/schoolYears/MigrationGateway";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  execute: vi.fn(),
  withTransaction: vi.fn(async (fn: () => Promise<void>) => fn()),
  loadGroups: vi.fn(),
  loadStudents: vi.fn(),
  insertGroup: vi.fn(),
  getNextOrdinal: vi.fn(),
  insertCourse: vi.fn(),
  insertDefaults: vi.fn(),
  linkSubject: vi.fn(),
}));

vi.mock("@/store/Database", () => ({
  db: { select: mocks.select, execute: mocks.execute },
  withTransaction: mocks.withTransaction,
  orQuery: (ids: number[], column: string, offset: number) =>
    ids.map((_id, index) => `${column} = $${index + offset}`).join(" OR "),
}));
vi.mock("@/components/groups/GroupGateway", () => ({
  loadGroupsBySchoolYearAndSemester: mocks.loadGroups,
  loadStudentsByGroup: mocks.loadStudents,
  insertGroup: mocks.insertGroup,
}));
vi.mock("@/components/courses/CourseGateway", () => ({
  getNextOrdinal: mocks.getNextOrdinal,
  insertCourse: mocks.insertCourse,
}));
vi.mock("@/components/courses/DefaultPerformances", () => ({
  insertDefaultPerformancesWithGrades: mocks.insertDefaults,
}));
vi.mock("@/components/subjects/SubjectGateway", () => ({
  linkSubjectToSchoolYear: mocks.linkSubject,
}));

const sourceYear: SchoolYear = {
  id: 1,
  start: new Date(2024, 7, 1),
  end: new Date(2025, 6, 31),
  firstSemester: { id: 10, type: 1, start: undefined, end: undefined },
  secondSemester: { id: 11, type: 2, start: undefined, end: undefined },
};
const targetYear: SchoolYear = {
  id: 2,
  start: new Date(2025, 7, 1),
  end: new Date(2026, 6, 31),
  firstSemester: { id: 20, type: 1, start: undefined, end: undefined },
  secondSemester: { id: 21, type: 2, start: undefined, end: undefined },
};
const student = { id: 30, firstName: "Ada", lastName: "Lovelace", groups: [], courses: [] };
const group = { id: 40, name: "11", sortingName: "11", type: 1, students: [student] };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.execute.mockResolvedValue({ rowsAffected: 1 });
  mocks.insertDefaults.mockResolvedValue(undefined);
  mocks.linkSubject.mockResolvedValue(undefined);
});

describe("loadMigratableGroups", () => {
  it("loads groups with their current students", async () => {
    mocks.loadGroups.mockResolvedValue([group]);
    mocks.loadStudents.mockResolvedValue([student]);

    const result = await loadMigratableGroups(sourceYear);

    expect(result[0].students).toEqual([student]);
    expect(mocks.loadStudents).toHaveBeenCalledWith(group);
  });
});

describe("loadMigratableCourses", () => {
  it("loads both semesters and maps their type", async () => {
    mocks.select.mockResolvedValue([
      {
        Z_PK: 50,
        ZGROUP: 40,
        ZSUBJECT: 60,
        ZSEMESTER: 10,
        ZYEAR: 1,
        ZDAYS: {},
        ZLEVEL: 1,
        ZORDINAL: 4,
        GROUPNAME: "11",
        GROUPTYPE: 1,
        SUBJECTNAME: "Geschichte",
        SEMESTERTYPE: 1,
      },
      {
        Z_PK: 51,
        ZGROUP: 40,
        ZSUBJECT: 60,
        ZSEMESTER: 11,
        ZYEAR: 1,
        ZDAYS: {},
        ZLEVEL: 1,
        ZORDINAL: 4,
        GROUPNAME: "11",
        GROUPTYPE: 1,
        SUBJECTNAME: "Geschichte",
        SEMESTERTYPE: 2,
      },
    ]);

    const result = await loadMigratableCourses(sourceYear, [40]);

    expect(result.map((course) => course.semester?.type)).toEqual([1, 2]);
    expect(mocks.select).toHaveBeenCalledWith(expect.stringContaining("ZSEMESTER.ZTYPEID"), [1, 40]);
  });

  it("does not issue an invalid query for no groups", async () => {
    expect(await loadMigratableCourses(sourceYear, [])).toEqual([]);
    expect(mocks.select).not.toHaveBeenCalled();
  });
});

describe("migrateSchoolYear", () => {
  it("links entities, maps semesters, assigns fresh ordinals, and creates fresh defaults", async () => {
    mocks.select.mockResolvedValue([
      {
        Z_PK: 50,
        ZGROUP: 40,
        ZSUBJECT: 60,
        ZSEMESTER: 10,
        ZYEAR: 1,
        ZDAYS: {},
        ZLEVEL: 1,
        ZORDINAL: 9,
        GROUPNAME: "11",
        GROUPTYPE: 1,
        SUBJECTNAME: "Geschichte",
        SEMESTERTYPE: 1,
      },
      {
        Z_PK: 51,
        ZGROUP: 40,
        ZSUBJECT: 60,
        ZSEMESTER: 11,
        ZYEAR: 1,
        ZDAYS: {},
        ZLEVEL: 2,
        ZORDINAL: 7,
        GROUPNAME: "11",
        GROUPTYPE: 1,
        SUBJECTNAME: "Geschichte",
        SEMESTERTYPE: 2,
      },
    ]);
    mocks.insertGroup.mockResolvedValueOnce(60);
    mocks.getNextOrdinal.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    mocks.insertCourse.mockResolvedValueOnce(70).mockResolvedValueOnce(71);
    const plan: SchoolYearMigrationPlan = {
      sourceYear,
      targetYear,
      groups: [{ group, newName: "12", selected: true, students: [{ student, included: true }] }],
    };

    await migrateSchoolYear(plan);

    expect(mocks.withTransaction).toHaveBeenCalledOnce();
    expect(mocks.insertGroup).toHaveBeenCalledWith(expect.objectContaining({ name: "12" }), targetYear);
    expect(mocks.linkSubject).toHaveBeenCalledOnce();
    expect(mocks.getNextOrdinal).toHaveBeenNthCalledWith(1, targetYear, expect.objectContaining({ id: 60 }), 1);
    expect(mocks.getNextOrdinal).toHaveBeenNthCalledWith(2, targetYear, expect.objectContaining({ id: 60 }), 2);
    expect(mocks.insertCourse).toHaveBeenNthCalledWith(1, expect.objectContaining({ semesterId: 20, ordinal: 1 }));
    expect(mocks.insertDefaults).toHaveBeenNthCalledWith(1, 70, 1, [student]);
    expect(mocks.insertDefaults).toHaveBeenNthCalledWith(2, 71, 1, [student]);
    const sql = mocks.execute.mock.calls.map((call) => call[0]).join("\n");
    expect(sql).toContain("INSERT OR IGNORE INTO Z_6YEARS");
    expect(sql).toContain("INSERT OR IGNORE INTO Z_3STUDENTS");
    expect(sql).toContain("INSERT OR IGNORE INTO Z_1STUDENTS");
    expect(sql).not.toContain("UPDATE ZPERFORMANCE");
    expect(sql).not.toContain("UPDATE ZGRADE");
  });

  it("excludes deselected students and deduplicates subject links", async () => {
    const excluded = { id: 31, firstName: "Grace", lastName: "Hopper", groups: [], courses: [] };
    mocks.select.mockResolvedValue([
      {
        Z_PK: 50,
        ZGROUP: 40,
        ZSUBJECT: 60,
        ZSEMESTER: 10,
        ZYEAR: 1,
        ZDAYS: {},
        ZLEVEL: 1,
        ZORDINAL: 1,
        GROUPNAME: "11",
        GROUPTYPE: 1,
        SUBJECTNAME: "Geschichte",
        SEMESTERTYPE: 1,
      },
      {
        Z_PK: 51,
        ZGROUP: 40,
        ZSUBJECT: 60,
        ZSEMESTER: 11,
        ZYEAR: 1,
        ZDAYS: {},
        ZLEVEL: 1,
        ZORDINAL: 1,
        GROUPNAME: "11",
        GROUPTYPE: 1,
        SUBJECTNAME: "Geschichte",
        SEMESTERTYPE: 2,
      },
    ]);
    mocks.getNextOrdinal.mockResolvedValue(1);
    mocks.insertCourse.mockResolvedValueOnce(70).mockResolvedValueOnce(71);

    await migrateSchoolYear({
      sourceYear,
      targetYear,
      groups: [
        {
          group,
          newName: "11",
          selected: true,
          students: [
            { student, included: true },
            { student: excluded, included: false },
          ],
        },
      ],
    });

    expect(mocks.linkSubject).toHaveBeenCalledOnce();
    expect(mocks.insertDefaults).toHaveBeenCalledWith(70, 1, [student]);
    expect(mocks.execute.mock.calls.some((call) => call[1]?.includes(31))).toBe(false);
  });
});
