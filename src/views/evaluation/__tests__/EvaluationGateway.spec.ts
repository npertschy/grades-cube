import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadCoursesForSchoolYearAndSemester,
  loadStudentsForCourse,
  loadPerformancesForCourse,
  loadStudentsForGroup,
  createPerformance,
  updatePerformance,
  updateGrade,
  deletePerformance,
} from "@/views/evaluation/EvaluationGateway";
import type { Course } from "@/components/courses/Course";
import type { Group } from "@/components/groups/Group";
import type { Performance } from "@/components/evaluations/Performance";
import type { Student } from "@/components/students/Student";
import { coreDataToUnix } from "@/store/DateConversion";
import { Z_ENT } from "@/store/EntityId";

const { mockedSelect, mockedExecute, mockedNextPrimaryKey } = vi.hoisted(() => ({
  mockedSelect: vi.fn(),
  mockedExecute: vi.fn(),
  mockedNextPrimaryKey: vi.fn(),
}));

vi.mock("@/store/Database", () => ({
  db: {
    select: mockedSelect,
    execute: mockedExecute,
  },
  nextPrimaryKey: mockedNextPrimaryKey,
}));

const schoolYear = { id: 1, start: undefined, end: undefined, firstSemester: undefined, secondSemester: undefined };
const semester = { id: 2, type: 1, start: undefined, end: undefined };
const course: Course = {
  id: 5,
  group: { id: 3, name: "5A", sortingName: "5A", type: 0, students: [] },
  subject: { id: 7, name: "Deutsch" },
  semester,
  schoolYear,
  days: undefined,
};
const group: Group = { id: 3, name: "5A", sortingName: "5A", type: 0, students: [] };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loadCoursesForSchoolYearAndSemester", () => {
  it("returns mapped courses", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 5, ZDAYS: 3, GROUPID: 3, GROUPNAME: "5A", SUBJECTID: 7, SUBJECTNAME: "Deutsch" },
    ]);

    const result = await loadCoursesForSchoolYearAndSemester(schoolYear, semester);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 5,
      days: 3,
      group: { id: 3, name: "5A" },
      subject: { id: 7, name: "Deutsch" },
      semester,
      schoolYear,
    });
  });
});

describe("loadStudentsForCourse", () => {
  it("groups flat rows into students with a grades array", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 20, ZFIRSTNAME: "Max", ZLASTNAME: "Muster", GRADEID: 10, GRADEVALUE: "2", PERFORMANCETITLE: "Test", PERFORMANCETYPE: 6 },
      { Z_PK: 20, ZFIRSTNAME: "Max", ZLASTNAME: "Muster", GRADEID: 11, GRADEVALUE: "+", PERFORMANCETITLE: "Oral", PERFORMANCETYPE: 0 },
    ]);

    const result = await loadStudentsForCourse(course);

    expect(result).toHaveLength(1);
    expect(result[0].student).toMatchObject({ id: 20, firstName: "Max", lastName: "Muster" });
    expect(result[0].grades).toHaveLength(2);
    expect(result[0].grades[0]).toMatchObject({
      id: 10,
      value: "2",
      performanceTitle: "Test",
      performanceType: 6,
    });
    expect(result[0].grades[1]).toMatchObject({
      id: 11,
      value: "+",
      performanceTitle: "Oral",
      performanceType: 0,
    });
  });

  it("handles students with no grades (null GRADEID)", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 20, ZFIRSTNAME: "Max", ZLASTNAME: "Muster", GRADEID: null, GRADEVALUE: null, PERFORMANCETITLE: null, PERFORMANCETYPE: null },
    ]);

    const result = await loadStudentsForCourse(course);

    expect(result).toHaveLength(1);
    expect(result[0].grades).toHaveLength(0);
  });
});

describe("loadPerformancesForCourse", () => {
  it("maps entity fields including coreDataToUnix date conversion", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 1, ZEDITABLE: 1, ZSORTORDER: 0, ZTYPE: "written", ZCOURSE: 5, ZDATE: 0, ZWEIGHT: 0.5, ZTITLE: "KA1" },
    ]);

    const result = await loadPerformancesForCourse(course);

    expect(result[0]).toMatchObject({
      id: 1,
      performanceId: "1",
      editable: true,
      sortOrder: 0,
      type: "written",
      courseId: 5,
      date: coreDataToUnix(0),
      weight: 0.5,
      title: "KA1",
    });
  });

  it("maps ZEDITABLE = 0 to editable: false", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 2, ZEDITABLE: 0, ZSORTORDER: 1, ZTYPE: "oral", ZCOURSE: 5, ZDATE: 0, ZWEIGHT: 0.5, ZTITLE: "Oral" },
    ]);

    const result = await loadPerformancesForCourse(course);

    expect(result[0].editable).toBe(false);
  });
});

describe("loadStudentsForGroup", () => {
  it("returns students ordered by the query", async () => {
    mockedSelect.mockResolvedValueOnce([
      { Z_PK: 1, ZFIRSTNAME: "Anna", ZLASTNAME: "Bauer" },
      { Z_PK: 2, ZFIRSTNAME: "Max", ZLASTNAME: "Muster" },
    ]);

    const result = await loadStudentsForGroup(group);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, firstName: "Anna", lastName: "Bauer" });
  });
});

describe("createPerformance", () => {
  it("inserts the performance then a grade row for each student using nextPrimaryKey inside a transaction", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedNextPrimaryKey.mockResolvedValueOnce(201);
    mockedNextPrimaryKey.mockResolvedValueOnce(202);
    mockedExecute.mockResolvedValue({});

    const performance: Performance = {
      id: undefined,
      performanceId: undefined,
      editable: true,
      sortOrder: 0,
      type: 6,
      courseId: 5,
      date: coreDataToUnix(0),
      weight: 0.5,
      title: "KA1",
    };
    const students: Student[] = [
      { id: 10, firstName: "A", lastName: "B", groups: [], courses: [] },
      { id: 11, firstName: "C", lastName: "D", groups: [], courses: [] },
    ];

    await createPerformance(performance, students);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith("Performance");
    expect(mockedNextPrimaryKey).toHaveBeenCalledWith("Grade");
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZPERFORMANCE"),
      [99, Z_ENT.ZPERFORMANCE, 1, 1, 0, 6, 5, expect.any(Number), 0.5, "KA1"],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZGRADE"),
      [201, Z_ENT.ZGRADE, 1, 99, 10],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ZGRADE"),
      [202, Z_ENT.ZGRADE, 1, 99, 11],
    );
    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls[0]).toContain("BEGIN");
    expect(calls[calls.length - 1]).toContain("COMMIT");
  });
});

describe("updatePerformance", () => {
  it("updates weight and title", async () => {
    mockedExecute.mockResolvedValueOnce({});

    const performance: Performance = {
      id: 1, performanceId: "1", editable: true, sortOrder: 0,
      type: 6, courseId: 5, date: coreDataToUnix(0), weight: 0.25, title: "KA2",
    };

    await updatePerformance(performance);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE ZPERFORMANCE"),
      [0.25, "KA2", 1],
    );
  });
});

describe("updateGrade", () => {
  it("updates the grade value", async () => {
    mockedExecute.mockResolvedValueOnce({});

    await updateGrade({ id: 10, value: "3", performanceTitle: "KA1", performanceType: 6 });

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE ZGRADE"),
      ["3", 10],
    );
  });
});

describe("deletePerformance", () => {
  it("deletes all grades and then the performance inside a transaction", async () => {
    mockedExecute.mockResolvedValue({});

    const performance: Performance = {
      id: 1, performanceId: "1", editable: true, sortOrder: 0,
      type: 6, courseId: 5, date: coreDataToUnix(0), weight: 0.5, title: "KA1",
    };

    await deletePerformance(performance);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZGRADE"),
      [1],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZPERFORMANCE"),
      [1],
    );
    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls[0]).toContain("BEGIN");
    expect(calls.at(-1)).toContain("COMMIT");
    const gradeIdx = calls.findIndex((s) => s.includes("DELETE FROM ZGRADE"));
    const perfIdx = calls.findIndex((s) => s.includes("DELETE FROM ZPERFORMANCE"));
    expect(gradeIdx).toBeLessThan(perfIdx);
  });
});
