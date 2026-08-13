import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import PToast from "primevue/toast";
import PConfirmDialog from "primevue/confirmdialog";
import SubjectManagement from "@/views/management/SubjectManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const { mockedLoadSubjectsBySchoolYear, mockedLoadAll, mockedDeleteSubject } = vi.hoisted(() => ({
  mockedLoadSubjectsBySchoolYear: vi.fn(),
  mockedLoadAll: vi.fn(),
  mockedDeleteSubject: vi.fn(),
}));

vi.mock("@/components/subjects/SubjectGateway", () => ({
  loadSubjectsBySchoolYear: mockedLoadSubjectsBySchoolYear,
  loadAll: mockedLoadAll,
  createSubjectForSchoolYear: vi.fn(),
  updateSubject: vi.fn(),
  deleteSubjectFromSchoolYear: mockedDeleteSubject,
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

const AppWrapper = defineComponent({
  components: { SubjectManagement, PToast, PConfirmDialog },
  template: `<div><PToast /><PConfirmDialog /><SubjectManagement /></div>`,
});

describe("SubjectManagement", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    mockedLoadSubjectsBySchoolYear.mockResolvedValue(subjects);
    mockedLoadAll.mockResolvedValue(subjects);
    mockedDeleteSubject.mockResolvedValue(undefined);
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

  it("displays all subjects plus the default 'create' entry in the list", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items).toHaveLength(4);
  });

  it("shows 'Neues Fach anlegen' as the first list entry", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");
    expect(items[0].text()).toEqual("Neues Fach anlegen");
  });

  it("populates the name input when a subject is selected", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    const input = w.find("input");
    expect(input.element.value).toEqual("Deutsch");
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

    expect(mockedDeleteSubject).not.toHaveBeenCalled();
  });

  it("deletes the subject when the confirm button is clicked in the confirmation dialog", async () => {
    const w = await mountAndFlush();
    const items = w.findAll("li[class='p-listbox-option']");

    await items[1].trigger("click");
    await flushPromises();

    await w.find("button.delete-button").trigger("click");
    await flushPromises();

    const acceptButton = document.querySelector<HTMLElement>(".p-confirmdialog-accept-button");
    acceptButton?.click();
    await flushPromises();

    expect(mockedDeleteSubject).toHaveBeenCalledOnce();
  });

  it("shows an error toast when deleting a subject fails", async () => {
    mockedDeleteSubject.mockRejectedValue(new Error("DB error"));

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
