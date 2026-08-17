import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import PToast from "primevue/toast";
import PConfirmDialog from "primevue/confirmdialog";
import StudentManagement from "@/views/management/StudentManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const {
  mockedLoadAllStudents,
  mockedLoadGroupsAndCourses,
  mockedLoadGroupsBySchoolYear,
  mockedLoadCoursesBySchoolYearAndSemester,
  mockedDeleteStudent,
} = vi.hoisted(() => ({
  mockedLoadAllStudents: vi.fn(),
  mockedLoadGroupsAndCourses: vi.fn(),
  mockedLoadGroupsBySchoolYear: vi.fn(),
  mockedLoadCoursesBySchoolYearAndSemester: vi.fn(),
  mockedDeleteStudent: vi.fn(),
}));

vi.mock("@/components/students/StudentGateway", () => ({
  loadAllStudentsForSchoolYear: mockedLoadAllStudents,
  loadGroupsAndCoursesForStudent: mockedLoadGroupsAndCourses,
  loadGroupsBySchoolYear: mockedLoadGroupsBySchoolYear,
  loadCoursesBySchoolYearAndSemester: mockedLoadCoursesBySchoolYearAndSemester,
  createStudentInSchoolYear: vi.fn(),
  updateStudent: vi.fn(),
  deleteStudentInSchoolYear: mockedDeleteStudent,
}));

vi.mock("@/components/courses/CourseGateway", () => ({
  assignStudentToCourse: vi.fn(),
  unassignStudentFromCourse: vi.fn(),
}));

vi.mock("@/components/groups/GroupGateway", () => ({
  assignStudentToGroup: vi.fn(),
  unassignStudentFromGroup: vi.fn(),
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

const AppWrapper = defineComponent({
  components: { StudentManagement, PToast, PConfirmDialog },
  template: `<div><PToast /><PConfirmDialog /><StudentManagement /></div>`,
});

describe("StudentManagement", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    mockedLoadAllStudents.mockResolvedValue(students);
    mockedLoadGroupsAndCourses.mockResolvedValue({ ...students[0], groups: [], courses: [] });
    mockedLoadGroupsBySchoolYear.mockResolvedValue([]);
    mockedLoadCoursesBySchoolYearAndSemester.mockResolvedValue([]);
    mockedDeleteStudent.mockResolvedValue(undefined);

    useSchoolYearSelection().selectedSchoolYear.value = schoolYear;
    useSchoolYearSelection().selectedSemester.value = semester;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  async function mountAndFlush() {
    wrapper = mount(AppWrapper, {
      attachTo: document.body,
      global: { plugins: [PrimeVue, ToastService, ConfirmationService] },
    });
    await flushPromises();
    return wrapper;
  }

  it("displays all students plus the default 'create' entry in the list", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(4);
  });

  it("shows 'Neuen Schüler anlegen' as the first list entry", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neuen Schüler anlegen");
  });

  it("populates the first name input when a student is selected", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    const labels = w.findAll("label");
    const firstNameLabel = labels.find((l) => l.text() === "Vorname");
    const input = w.find(`input[id="${firstNameLabel?.element.htmlFor}"]`);

    expect(input.attributes("value")).toEqual("Max");
  });

  it("shows a confirmation dialog when the delete button is clicked", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    await w.find("button.delete-button").trigger("click");
    await flushPromises();

    const dialog = document.querySelector(".p-confirmdialog");
    expect(dialog).not.toBeNull();
  });

  it("does not delete when the cancel button is clicked in the confirmation dialog", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    await w.find("button.delete-button").trigger("click");
    await flushPromises();

    const rejectButton = document.querySelector<HTMLElement>(".p-confirmdialog-reject-button");
    rejectButton?.click();
    await flushPromises();

    expect(mockedDeleteStudent).not.toHaveBeenCalled();
  });

  it("deletes the student when the confirm button is clicked in the confirmation dialog", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    await w.find("button.delete-button").trigger("click");
    await flushPromises();

    const acceptButton = document.querySelector<HTMLElement>(".p-confirmdialog-accept-button");
    acceptButton?.click();
    await flushPromises();

    expect(mockedDeleteStudent).toHaveBeenCalledOnce();
  });

  it("shows an error toast when deleting a student fails", async () => {
    mockedDeleteStudent.mockRejectedValue(new Error("DB error"));

    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    await w.find("button.delete-button").trigger("click");
    await flushPromises();

    const acceptButton = document.querySelector<HTMLElement>(".p-confirmdialog-accept-button");
    acceptButton?.click();
    await flushPromises();

    const toast = document.querySelector(".p-toast");
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain("Fehler");
  });
});
