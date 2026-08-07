import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import CourseManagement from "@/views/management/CourseManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const {
  mockedLoadCourses,
  mockedLoadStudentsByCourse,
  mockedLoadAvailableGroups,
  mockedLoadAvailableSubjects,
} = vi.hoisted(() => ({
  mockedLoadCourses: vi.fn(),
  mockedLoadStudentsByCourse: vi.fn(),
  mockedLoadAvailableGroups: vi.fn(),
  mockedLoadAvailableSubjects: vi.fn(),
}));

vi.mock("@/components/courses/CourseGateway", () => ({
  loadCoursesBySchoolYearAndSemester: mockedLoadCourses,
  loadStudentsByCourse: mockedLoadStudentsByCourse,
  loadAvailableGroupsBySchoolYear: mockedLoadAvailableGroups,
  loadAvailableSubjectsBySchoolYear: mockedLoadAvailableSubjects,
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourseInSchoolYear: vi.fn(),
  assignStudentToCourse: vi.fn(),
  unassignStudentFromCourse: vi.fn(),
}));

vi.mock("@/components/students/StudentGateway", () => ({
  loadAllStudentsForSchoolYear: vi.fn().mockResolvedValue([]),
  loadGroupsAndCoursesForStudent: vi.fn(),
  loadGroupsBySchoolYear: vi.fn().mockResolvedValue([]),
  loadCoursesBySchoolYearAndSemester: vi.fn().mockResolvedValue([]),
  createStudentInSchoolYear: vi.fn(),
  updateStudent: vi.fn(),
  deleteStudentInSchoolYear: vi.fn(),
}));

const schoolYear = {
  id: 1,
  start: undefined,
  end: undefined,
  firstSemester: undefined,
  secondSemester: undefined,
};

const semester = { id: 1, type: 1, start: undefined, end: undefined };

const courses = [
  {
    id: 1,
    group: { id: 1, name: "5A", sortingName: "5A", type: 0, students: [] },
    subject: { id: 1, name: "Deutsch" },
    semester,
    schoolYear,
    days: undefined,
  },
  {
    id: 2,
    group: { id: 2, name: "6B", sortingName: "6B", type: 0, students: [] },
    subject: { id: 2, name: "Englisch" },
    semester,
    schoolYear,
    days: undefined,
  },
];

describe("CourseManagement", () => {
  beforeEach(() => {
    mockedLoadCourses.mockResolvedValue(courses);
    mockedLoadStudentsByCourse.mockResolvedValue([]);
    mockedLoadAvailableGroups.mockResolvedValue([]);
    mockedLoadAvailableSubjects.mockResolvedValue([]);

    useSchoolYearSelection().selectedSchoolYear.value = schoolYear;
    useSchoolYearSelection().selectedSemester.value = semester;
  });

  async function mountAndFlush() {
    const wrapper = mount(CourseManagement, { global: { plugins: [PrimeVue] } });
    await flushPromises();
    return wrapper;
  }

  it("displays all courses plus the default 'create' entry in the list", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(3);
  });

  it("shows 'Neuen Kurs anlegen' as the first list entry", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neuen Kurs anlegen");
  });

  it("formats course entries as 'group - subject'", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items[1].text()).toEqual("5A - Deutsch");
  });
});
