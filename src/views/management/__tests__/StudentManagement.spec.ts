import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import StudentManagement from "@/views/management/StudentManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const {
  mockedLoadAllStudents,
  mockedLoadGroupsAndCourses,
  mockedLoadGroupsBySchoolYear,
  mockedLoadCoursesBySchoolYearAndSemester,
} = vi.hoisted(() => ({
  mockedLoadAllStudents: vi.fn(),
  mockedLoadGroupsAndCourses: vi.fn(),
  mockedLoadGroupsBySchoolYear: vi.fn(),
  mockedLoadCoursesBySchoolYearAndSemester: vi.fn(),
}));

vi.mock("@/components/students/StudentGateway", () => ({
  loadAllStudentsForSchoolYear: mockedLoadAllStudents,
  loadGroupsAndCoursesForStudent: mockedLoadGroupsAndCourses,
  loadGroupsBySchoolYear: mockedLoadGroupsBySchoolYear,
  loadCoursesBySchoolYearAndSemester: mockedLoadCoursesBySchoolYearAndSemester,
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

const students = [
  { id: 1, firstName: "Max", lastName: "Mustermann", groups: undefined, courses: undefined },
  { id: 2, firstName: "Thomas", lastName: "König", groups: undefined, courses: undefined },
  { id: 3, firstName: "Klara", lastName: "Hamberger", groups: undefined, courses: undefined },
];

describe("StudentManagement", () => {
  beforeEach(() => {
    mockedLoadAllStudents.mockResolvedValue(students);
    mockedLoadGroupsAndCourses.mockResolvedValue({ ...students[0], groups: [], courses: [] });
    mockedLoadGroupsBySchoolYear.mockResolvedValue([]);
    mockedLoadCoursesBySchoolYearAndSemester.mockResolvedValue([]);

    useSchoolYearSelection().selectedSchoolYear.value = schoolYear;
    useSchoolYearSelection().selectedSemester.value = semester;
  });

  async function mountAndFlush() {
    const wrapper = mount(StudentManagement, { global: { plugins: [PrimeVue] } });
    await flushPromises();
    return wrapper;
  }

  it("displays all students plus the default 'create' entry in the list", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(4);
  });

  it("shows 'Neuen Schüler anlegen' as the first list entry", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neuen Schüler anlegen");
  });

  it("populates the first name input when a student is selected", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    const labels = wrapper.findAll("label");
    const firstNameLabel = labels.find((l) => l.text() === "Vorname");
    const input = wrapper.find(`input[id="${firstNameLabel?.element.htmlFor}"]`);

    expect(input.attributes("value")).toEqual("Max");
  });
});
