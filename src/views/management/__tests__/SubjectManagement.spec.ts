import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import SubjectManagement from "@/views/management/SubjectManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const { mockedLoadSubjectsBySchoolYear, mockedLoadAll } = vi.hoisted(() => ({
  mockedLoadSubjectsBySchoolYear: vi.fn(),
  mockedLoadAll: vi.fn(),
}));

vi.mock("@/components/subjects/SubjectGateway", () => ({
  loadSubjectsBySchoolYear: mockedLoadSubjectsBySchoolYear,
  loadAll: mockedLoadAll,
  createSubjectForSchoolYear: vi.fn(),
  updateSubject: vi.fn(),
  deleteSubjectFromSchoolYear: vi.fn(),
}));

const schoolYear = {
  id: 1,
  start: undefined,
  end: undefined,
  firstSemester: undefined,
  secondSemester: undefined,
};

const subjects = [
  { id: 1, name: "Deutsch" },
  { id: 2, name: "Englisch" },
  { id: 3, name: "Sport" },
];

describe("SubjectManagement", () => {
  beforeEach(() => {
    mockedLoadSubjectsBySchoolYear.mockResolvedValue(subjects);
    mockedLoadAll.mockResolvedValue(subjects);
    useSchoolYearSelection().selectedSchoolYear.value = schoolYear;
  });

  async function mountAndFlush() {
    const wrapper = mount(SubjectManagement, { global: { plugins: [PrimeVue] } });
    await flushPromises();
    return wrapper;
  }

  it("displays all subjects plus the default 'create' entry in the list", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(4);
  });

  it("shows 'Neues Fach anlegen' as the first list entry", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neues Fach anlegen");
  });

  it("populates the name input when a subject is selected", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    const input = wrapper.find("input");
    expect(input.element.value).toEqual("Deutsch");
  });
});
