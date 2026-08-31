import SchoolYearMigrationDialog from "@/components/schoolYears/SchoolYearMigrationDialog.vue";
import { flushPromises, mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MigrationCoursePreview, MigrationGroupSelection } from "@/components/schoolYears/Migration";
import type { Student } from "@/components/students/Student";

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  toggleGroup: vi.fn(),
  toggleStudent: vi.fn(),
  rename: vi.fn(),
  addStudent: vi.fn(),
  build: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
}));
const groups = ref<MigrationGroupSelection[]>([]);
const availableStudents = ref<Student[]>([]);
const coursePreviews = ref<MigrationCoursePreview[]>([]);

vi.mock("@/components/schoolYears/MigrationStore", () => ({
  useMigration: () => ({
    groups,
    availableStudents,
    coursePreviews,
    startMigration: mocks.start,
    toggleGroupSelected: mocks.toggleGroup,
    toggleStudentIncluded: mocks.toggleStudent,
    renameGroup: mocks.rename,
    addStudentToGroup: mocks.addStudent,
    buildCoursePreviews: mocks.build,
    confirmMigration: mocks.confirm,
    cancelMigration: mocks.cancel,
  }),
}));
vi.mock("@/components/courses/CourseStore", () => ({
  useCourses: () => ({ formatCourse: () => "GK 1 Geschichte" }),
}));

const sourceYear = {
  id: 1, start: new Date(2024, 7, 1), end: new Date(2025, 6, 31),
  firstSemester: { id: 10, type: 1, start: undefined, end: undefined },
  secondSemester: { id: 11, type: 2, start: undefined, end: undefined },
};
const targetYear = {
  id: 2, start: new Date(2025, 7, 1), end: new Date(2026, 6, 31),
  firstSemester: { id: 20, type: 1, start: undefined, end: undefined },
  secondSemester: { id: 21, type: 2, start: undefined, end: undefined },
};

beforeEach(() => {
  vi.resetAllMocks();
  groups.value = [{
    group: { id: 40, name: "11", sortingName: "11", type: 1, students: [] },
    newName: "12",
    selected: true,
    students: [],
  }];
  mocks.start.mockResolvedValue(undefined);
  mocks.build.mockResolvedValue([]);
  mocks.confirm.mockResolvedValue(undefined);
});

describe("SchoolYearMigrationDialog", () => {
  it("starts migration and navigates to course preview", async () => {
    const wrapper = mount(SchoolYearMigrationDialog, {
      attachTo: document.body,
      props: { visible: true, sourceYear, targetYear },
      global: { plugins: [PrimeVue, ToastService] },
    });
    await flushPromises();

    expect(mocks.start).toHaveBeenCalledWith(sourceYear, targetYear);
    const next = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Weiter"));
    (next as HTMLElement).click();
    await flushPromises();

    expect(mocks.build).toHaveBeenCalledOnce();
    expect(document.body.textContent).toContain("Migration abschließen");
    wrapper.unmount();
  });

  it("cancels and discards wizard state", async () => {
    const wrapper = mount(SchoolYearMigrationDialog, {
      attachTo: document.body,
      props: { visible: true, sourceYear, targetYear },
      global: { plugins: [PrimeVue, ToastService] },
    });
    await flushPromises();

    const cancel = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Abbrechen"));
    (cancel as HTMLElement).click();
    await flushPromises();

    expect(mocks.cancel).toHaveBeenCalled();
    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it("confirms migration, closes, and emits migrated", async () => {
    const wrapper = mount(SchoolYearMigrationDialog, {
      attachTo: document.body,
      props: { visible: true, sourceYear, targetYear },
      global: { plugins: [PrimeVue, ToastService] },
    });
    await flushPromises();
    const next = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Weiter"));
    (next as HTMLElement).click();
    await flushPromises();
    const finish = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("Migration abschließen"));
    (finish as HTMLElement).click();
    await flushPromises();

    expect(mocks.confirm).toHaveBeenCalledOnce();
    expect(wrapper.emitted("migrated")).toHaveLength(1);
    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });
});
