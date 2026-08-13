import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import PToast from "primevue/toast";
import PConfirmDialog from "primevue/confirmdialog";
import SchoolYearManagement from "@/views/management/SchoolYearManagement.vue";

const { mockedLoadAll, mockedDeleteSchoolYear } = vi.hoisted(() => ({
  mockedLoadAll: vi.fn(),
  mockedDeleteSchoolYear: vi.fn(),
}));

vi.mock("@/components/schoolYears/SchoolYearGateway", () => ({
  loadAll: mockedLoadAll,
  createSchoolYear: vi.fn(),
  updateSchoolYear: vi.fn(),
  deleteSchoolYear: mockedDeleteSchoolYear,
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

const AppWrapper = defineComponent({
  components: { SchoolYearManagement, PToast, PConfirmDialog },
  template: `<div><PToast /><PConfirmDialog /><SchoolYearManagement /></div>`,
});

describe("SchoolYearManagement", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    mockedLoadAll.mockResolvedValue(schoolYears);
    mockedDeleteSchoolYear.mockResolvedValue(undefined);
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

  it("displays all school years plus the default 'create' entry in the list", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(3);
  });

  it("shows 'Neues Schuljahr anlegen' as the first list entry", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neues Schuljahr anlegen");
  });

  it("formats school year entries as 'startYear/endYear'", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items[1].text()).toEqual("2024/2024");
  });

  it("populates date inputs when a school year is selected", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    const inputs = w.findAll("input[type='text']");
    expect(inputs.length).toBeGreaterThanOrEqual(4);
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

    expect(mockedDeleteSchoolYear).not.toHaveBeenCalled();
  });

  it("deletes the school year when the confirm button is clicked in the confirmation dialog", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    await w.find("button.delete-button").trigger("click");
    await flushPromises();

    const acceptButton = document.querySelector<HTMLElement>(".p-confirmdialog-accept-button");
    acceptButton?.click();
    await flushPromises();

    expect(mockedDeleteSchoolYear).toHaveBeenCalledOnce();
  });

  it("shows an error toast when deleting a school year fails", async () => {
    mockedDeleteSchoolYear.mockRejectedValue(new Error("DB error"));

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
