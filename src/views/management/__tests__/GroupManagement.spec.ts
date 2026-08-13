import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import PToast from "primevue/toast";
import PConfirmDialog from "primevue/confirmdialog";
import GroupManagement from "@/views/management/GroupManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const { mockedLoadGroupsBySchoolYear, mockedLoadStudentsByGroup, mockedDeleteGroup } = vi.hoisted(() => ({
  mockedLoadGroupsBySchoolYear: vi.fn(),
  mockedLoadStudentsByGroup: vi.fn(),
  mockedDeleteGroup: vi.fn(),
}));

vi.mock("@/components/groups/GroupGateway", () => ({
  loadGroupsBySchoolYearAndSemester: mockedLoadGroupsBySchoolYear,
  loadStudentsByGroup: mockedLoadStudentsByGroup,
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroupInSchoolYear: mockedDeleteGroup,
  assignStudentToGroup: vi.fn(),
  unassignStudentFromGroup: vi.fn(),
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

const groups = [
  { id: 1, name: "5A", sortingName: "5A", type: 0, students: [] },
  { id: 2, name: "6B", sortingName: "6B", type: 0, students: [] },
];

const AppWrapper = defineComponent({
  components: { GroupManagement, PToast, PConfirmDialog },
  template: `<div><PToast /><PConfirmDialog /><GroupManagement /></div>`,
});

describe("GroupManagement", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    mockedLoadGroupsBySchoolYear.mockResolvedValue(groups);
    mockedLoadStudentsByGroup.mockResolvedValue([]);
    mockedDeleteGroup.mockResolvedValue(undefined);
    useSchoolYearSelection().selectedSchoolYear.value = schoolYear;
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

  it("displays all groups plus the default 'create' entry in the list", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(3);
  });

  it("shows 'Neue Klasse anlegen' as the first list entry", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neue Klasse anlegen");
  });

  it("populates the name input when a group is selected", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    const labels = w.findAll("label");
    const nameLabel = labels.find((l) => l.text() === "Name");
    const input = w.find(`input[id="${nameLabel?.element.htmlFor}"]`);

    expect(input.attributes("value")).toEqual("5A");
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

    expect(mockedDeleteGroup).not.toHaveBeenCalled();
  });

  it("deletes the group when the confirm button is clicked in the confirmation dialog", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    await w.find("button.delete-button").trigger("click");
    await flushPromises();

    const acceptButton = document.querySelector<HTMLElement>(".p-confirmdialog-accept-button");
    acceptButton?.click();
    await flushPromises();

    expect(mockedDeleteGroup).toHaveBeenCalledOnce();
  });

  it("shows an error toast when deleting a group fails", async () => {
    mockedDeleteGroup.mockRejectedValue(new Error("DB error"));

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
