import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import PToast from "primevue/toast";
import PConfirmDialog from "primevue/confirmdialog";
import CourseManagement from "@/views/management/CourseManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const {
  mockedLoadCourses,
  mockedLoadStudentsByCourse,
  mockedLoadAvailableGroups,
  mockedLoadAvailableSubjects,
  mockedDeleteCourse,
} = vi.hoisted(() => ({
  mockedLoadCourses: vi.fn(),
  mockedLoadStudentsByCourse: vi.fn(),
  mockedLoadAvailableGroups: vi.fn(),
  mockedLoadAvailableSubjects: vi.fn(),
  mockedDeleteCourse: vi.fn(),
}));

vi.mock("@/components/courses/CourseGateway", () => ({
  loadCoursesBySchoolYearAndSemester: mockedLoadCourses,
  loadStudentsByCourse: mockedLoadStudentsByCourse,
  loadAvailableGroupsBySchoolYear: mockedLoadAvailableGroups,
  loadAvailableSubjectsBySchoolYear: mockedLoadAvailableSubjects,
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourseInSchoolYear: mockedDeleteCourse,
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

const AppWrapper = defineComponent({
  components: { CourseManagement, PToast, PConfirmDialog },
  template: `<div><PToast /><PConfirmDialog /><CourseManagement /></div>`,
});

describe("CourseManagement", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    mockedLoadCourses.mockResolvedValue(courses);
    mockedLoadStudentsByCourse.mockResolvedValue([]);
    mockedLoadAvailableGroups.mockResolvedValue([]);
    mockedLoadAvailableSubjects.mockResolvedValue([]);
    mockedDeleteCourse.mockResolvedValue(undefined);

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

  it("displays all courses plus the default 'create' entry in the list", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(3);
  });

  it("shows 'Neuen Kurs anlegen' as the first list entry", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neuen Kurs anlegen");
  });

  it("formats course entries as 'group - subject'", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items[1].text()).toEqual("5A - Deutsch");
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

    expect(mockedDeleteCourse).not.toHaveBeenCalled();
  });

  it("deletes the course when the confirm button is clicked in the confirmation dialog", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    await w.find("button.delete-button").trigger("click");
    await flushPromises();

    const acceptButton = document.querySelector<HTMLElement>(".p-confirmdialog-accept-button");
    acceptButton?.click();
    await flushPromises();

    expect(mockedDeleteCourse).toHaveBeenCalledOnce();
  });

  it("shows an error toast when deleting a course fails", async () => {
    mockedDeleteCourse.mockRejectedValue(new Error("DB error"));

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
