import type { Course } from "@/components/courses/Course";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import { useMigration } from "@/components/schoolYears/MigrationStore";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadGroups: vi.fn(),
  loadCourses: vi.fn(),
  loadStudents: vi.fn(),
  migrate: vi.fn(),
  loadTargetGroups: vi.fn(),
  loadTargetStudents: vi.fn(),
  loadTargetSubjects: vi.fn(),
}));

vi.mock("@/components/schoolYears/MigrationGateway", () => ({
  loadMigratableGroups: mocks.loadGroups,
  loadMigratableCourses: mocks.loadCourses,
  loadMigrationStudents: mocks.loadStudents,
  migrateSchoolYear: mocks.migrate,
}));
vi.mock("@/components/groups/GroupStore", () => ({
  useGroups: () => ({ loadAllGroupsForSchoolYearAndSemester: mocks.loadTargetGroups }),
}));
vi.mock("@/components/students/StudentStore", () => ({
  useStudents: () => ({ loadStudentsForSchoolYear: mocks.loadTargetStudents }),
}));
vi.mock("@/components/subjects/SubjectStore", () => ({
  useSubjects: () => ({ loadSubjectsForSchoolYear: mocks.loadTargetSubjects }),
}));
const sourceYear: SchoolYear = {
  id: 1,
  start: undefined,
  end: undefined,
  firstSemester: { id: 10, type: 1, start: undefined, end: undefined },
  secondSemester: { id: 11, type: 2, start: undefined, end: undefined },
};
const targetYear: SchoolYear = {
  id: 2,
  start: undefined,
  end: undefined,
  firstSemester: { id: 20, type: 1, start: undefined, end: undefined },
  secondSemester: { id: 21, type: 2, start: undefined, end: undefined },
};
const student = { id: 30, firstName: "Ada", lastName: "Lovelace", groups: [], courses: [] };
const otherStudent = { id: 31, firstName: "Grace", lastName: "Hopper", groups: [], courses: [] };
const group = { id: 40, name: "11", sortingName: "11", type: 1, students: [student] };

function course(id: number, semesterType: 1 | 2): Course {
  return {
    id,
    group,
    subject: { id: 60, name: "Geschichte" },
    schoolYear: sourceYear,
    semester: semesterType === 1 ? sourceYear.firstSemester : sourceYear.secondSemester,
    days: {},
    level: 1,
    ordinal: 1,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  useMigration().cancelMigration();
  mocks.loadGroups.mockResolvedValue([group]);
  mocks.loadStudents.mockResolvedValue([student, otherStudent]);
  mocks.loadCourses.mockResolvedValue([course(50, 1), course(51, 2)]);
  mocks.migrate.mockResolvedValue(undefined);
  mocks.loadTargetGroups.mockResolvedValue(undefined);
  mocks.loadTargetStudents.mockResolvedValue(undefined);
  mocks.loadTargetSubjects.mockResolvedValue(undefined);
});

describe("useMigration", () => {
  it("starts with groups unselected and all current members included", async () => {
    const migration = useMigration();
    await migration.startMigration(sourceYear, targetYear);

    expect(migration.groups.value[0]).toMatchObject({ selected: false, newName: "11" });
    expect(migration.groups.value[0].students).toEqual([{ student, included: true }]);
    expect(migration.availableStudents.value).toEqual([student, otherStudent]);
  });

  it("propagates renames and adjusted students into both-semester previews", async () => {
    const migration = useMigration();
    await migration.startMigration(sourceYear, targetYear);
    migration.toggleGroupSelected(40);
    migration.renameGroup(40, "12");
    migration.toggleStudentIncluded(40, 30);
    migration.addStudentToGroup(40, otherStudent);

    const previews = await migration.buildCoursePreviews();

    expect(previews.map((preview) => preview.targetSemesterType)).toEqual([1, 2]);
    expect(previews.every((preview) => preview.newGroupName === "12")).toBe(true);
    expect(previews.every((preview) => preview.course.group?.name === "12")).toBe(true);
    expect(previews.every((preview) => preview.students.map((item) => item.id).join() === "31")).toBe(true);
  });

  it("confirms the plan, reloads target data, and clears ephemeral state", async () => {
    const migration = useMigration();
    await migration.startMigration(sourceYear, targetYear);
    migration.toggleGroupSelected(40);

    await migration.confirmMigration();

    expect(mocks.migrate).toHaveBeenCalledWith(expect.objectContaining({ sourceYear, targetYear }));
    expect(mocks.loadTargetGroups).toHaveBeenCalledWith(targetYear);
    expect(mocks.loadTargetStudents).toHaveBeenCalledWith(targetYear);
    expect(mocks.loadTargetSubjects).toHaveBeenCalledWith(targetYear);
    expect(migration.groups.value).toEqual([]);
    expect(migration.sourceYear.value).toBeUndefined();
  });

  it("discards all state on cancel", async () => {
    const migration = useMigration();
    await migration.startMigration(sourceYear, targetYear);
    await migration.buildCoursePreviews();

    migration.cancelMigration();

    expect(migration.groups.value).toEqual([]);
    expect(migration.coursePreviews.value).toEqual([]);
    expect(migration.availableStudents.value).toEqual([]);
  });
});
