import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import SubjectManagement from "@/views/management/SubjectManagement.vue";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

vi.mock("@/components/subjects/SubjectGateway", () => {
  const SubjectGateway = vi.fn(() => ({
    loadSubjectsForSchoolYear: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: "Deutsch",
      },
      {
        id: 2,
        name: "Englisch",
      },
      {
        id: 3,
        name: "Sport",
      },
    ]),
    createSubjectForSchoolYear: vi.fn(),
    updateSubject: vi.fn(),
    deleteSubjectFromSchoolYear: vi.fn()
  }))
  return { SubjectGateway }
});

describe("SubjectManagement", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const wrapper = mount(SubjectManagement, {
    global: {
      plugins: [PrimeVue],
    },
  });

  useSchoolYearSelection().selectedSchoolYear.value = {
    id: 1,
    start: undefined,
    end: undefined,
    firstSemester: undefined,
    secondSemester: undefined
  }

  describe("given subjects", () => {
    it("should display subject in a list", () => {
      const listElements = wrapper.findAll("li");
      expect(listElements).toHaveLength(4);
    });
  });
});
