import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import GroupManagement from "@/views/management/GroupManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const { mockedLoadGroupsBySchoolYear, mockedLoadStudentsByGroup } = vi.hoisted(() => ({
  mockedLoadGroupsBySchoolYear: vi.fn(),
  mockedLoadStudentsByGroup: vi.fn(),
}));

vi.mock("@/components/groups/GroupGateway", () => ({
  loadGroupsBySchoolYearAndSemester: mockedLoadGroupsBySchoolYear,
  loadStudentsByGroup: mockedLoadStudentsByGroup,
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroupInSchoolYear: vi.fn(),
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

describe("GroupManagement", () => {
  beforeEach(() => {
    mockedLoadGroupsBySchoolYear.mockResolvedValue(groups);
    mockedLoadStudentsByGroup.mockResolvedValue([]);
    useSchoolYearSelection().selectedSchoolYear.value = schoolYear;
  });

  async function mountAndFlush() {
    const wrapper = mount(GroupManagement, { global: { plugins: [PrimeVue] } });
    await flushPromises();
    return wrapper;
  }

  it("displays all groups plus the default 'create' entry in the list", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(3);
  });

  it("shows 'Neue Klasse anlegen' as the first list entry", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neue Klasse anlegen");
  });

  it("populates the name input when a group is selected", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    const labels = wrapper.findAll("label");
    const nameLabel = labels.find((l) => l.text() === "Name");
    const input = wrapper.find(`input[id="${nameLabel?.element.htmlFor}"]`);

    expect(input.attributes("value")).toEqual("5A");
  });
});
