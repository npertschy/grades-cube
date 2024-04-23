import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import SubjectManagement from "@/views/management/SubjectManagement.vue";

vi.mock("@/components/subjects/SubjectGateway", () => {
  const SubjectGateway = vi.fn(() => ({
    loadAllSubjects: vi.fn().mockReturnValue([
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
    createSubject: vi.fn(),
    updateSubject: vi.fn(),
    deleteSubject: vi.fn()
  }))
  return { SubjectGateway }
});

describe("SubjectManagement", () => {
  const wrapper = mount(SubjectManagement, {
    global: {
      plugins: [PrimeVue],
    },
  });


  // subjects.value = ;

  describe("given subjects", () => {
    it("should display subject in a list", () => {
      const listElements = wrapper.findAll("li");
      expect(listElements).toHaveLength(4);
    });
  });
});
