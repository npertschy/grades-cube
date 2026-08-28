import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEvaluations } from "@/views/evaluation/EvaluationStore";
import type { Course } from "@/components/courses/Course";
import type { Performance } from "@/components/evaluations/Performance";
import { coreDataToUnix } from "@/store/DateConversion";

const {
  mockedLoadCourses,
  mockedCreatePerformance,
  mockedUpdatePerformance,
} = vi.hoisted(() => ({
  mockedLoadCourses: vi.fn(),
  mockedCreatePerformance: vi.fn(),
  mockedUpdatePerformance: vi.fn(),
}));

vi.mock("@/views/evaluation/EvaluationGateway", () => ({
  loadCoursesForSchoolYearAndSemester: mockedLoadCourses,
  loadStudentsForCourse: vi.fn().mockResolvedValue([]),
  loadStudentsForGroup: vi.fn().mockResolvedValue([]),
  loadPerformancesForCourse: vi.fn().mockResolvedValue([]),
  createPerformance: mockedCreatePerformance,
  updatePerformance: mockedUpdatePerformance,
  updateGrade: vi.fn(),
}));

const schoolYear = { id: 1, start: undefined, end: undefined, firstSemester: undefined, secondSemester: undefined };
const semester = { id: 2, type: 1, start: undefined, end: undefined };

function makeCourse(id: number, groupId: number, groupName: string, subjectName: string): Course {
  return {
    id,
    group: { id: groupId, name: groupName, sortingName: groupName, type: 0, students: [] },
    subject: { id: id * 10, name: subjectName },
    semester,
    schoolYear,
    days: undefined,
    level: undefined,
    ordinal: undefined,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loadTreeItems", () => {
  it("groups courses by group into tree nodes", async () => {
    mockedLoadCourses.mockResolvedValueOnce([
      makeCourse(1, 10, "5A", "Deutsch"),
      makeCourse(2, 10, "5A", "Englisch"),
      makeCourse(3, 20, "6B", "Mathe"),
    ]);

    const { loadTreeItems, treeItems } = useEvaluations();
    await loadTreeItems(schoolYear, semester);

    expect(treeItems.value).toHaveLength(2);

    const groupA = treeItems.value.find((n) => n.label === "5A");
    expect(groupA?.children).toHaveLength(2);
    expect(groupA?.children?.map((c) => c.label)).toEqual(["Deutsch", "Englisch"]);

    const groupB = treeItems.value.find((n) => n.label === "6B");
    expect(groupB?.children).toHaveLength(1);
  });

  it("assigns correct type and data to nodes", async () => {
    const course = makeCourse(1, 10, "5A", "Deutsch");
    mockedLoadCourses.mockResolvedValueOnce([course]);

    const { loadTreeItems, treeItems } = useEvaluations();
    await loadTreeItems(schoolYear, semester);

    const groupNode = treeItems.value[0];
    expect(groupNode.type).toBe("group");
    expect(groupNode.data).toMatchObject({ id: 10, name: "5A" });

    const courseNode = groupNode.children![0];
    expect(courseNode.type).toBe("course");
    expect(courseNode.data).toMatchObject({ id: 1 });
  });
});

describe("createPerformance", () => {
  it("sets weight to 0 when there are no existing performances", async () => {
    mockedCreatePerformance.mockResolvedValueOnce({});

    const newPerformance: Performance = {
      id: undefined, performanceId: undefined, editable: true, sortOrder: 0,
      type: 6, courseId: 5, date: coreDataToUnix(0), weight: 0, title: "KA1",
    };

    const { createPerformance } = useEvaluations();
    await createPerformance(newPerformance, []);

    expect(newPerformance.weight).toBe(0);
    expect(mockedUpdatePerformance).not.toHaveBeenCalled();
  });
});
