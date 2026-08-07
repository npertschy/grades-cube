import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import SchoolYearManagement from "@/views/management/SchoolYearManagement.vue";

const { mockedLoadAll } = vi.hoisted(() => ({
  mockedLoadAll: vi.fn(),
}));

vi.mock("@/components/schoolYears/SchoolYearGateway", () => ({
  loadAll: mockedLoadAll,
  createSchoolYear: vi.fn(),
  updateSchoolYear: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: {} }),
}));

const jan = (day: number) => new Date(2024, 0, day);

const schoolYears = [
  {
    id: 1,
    start: jan(1),
    end: jan(31),
    firstSemester: { id: 10, type: 1, start: jan(1), end: jan(15) },
    secondSemester: { id: 11, type: 2, start: jan(16), end: jan(31) },
  },
  {
    id: 2,
    start: jan(1),
    end: jan(31),
    firstSemester: { id: 12, type: 1, start: jan(1), end: jan(15) },
    secondSemester: { id: 13, type: 2, start: jan(16), end: jan(31) },
  },
];

describe("SchoolYearManagement", () => {
  beforeEach(() => {
    mockedLoadAll.mockResolvedValue(schoolYears);
  });

  async function mountAndFlush() {
    const wrapper = mount(SchoolYearManagement, { global: { plugins: [PrimeVue] } });
    await flushPromises();
    return wrapper;
  }

  it("displays all school years plus the default 'create' entry in the list", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(3);
  });

  it("shows 'Neues Schuljahr anlegen' as the first list entry", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neues Schuljahr anlegen");
  });

  it("formats school year entries as 'startYear/endYear'", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");
    expect(items[1].text()).toEqual("2024/2024");
  });

  it("populates date inputs when a school year is selected", async () => {
    const wrapper = await mountAndFlush();
    const items = wrapper.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    const inputs = wrapper.findAll("input[type='text']");
    expect(inputs.length).toBeGreaterThanOrEqual(4);
  });
});
