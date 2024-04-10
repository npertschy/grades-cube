import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import SubjectManagement from "@/views/management/SubjectManagement.vue";
import { useSubjects } from "@/components/subjects/SubjectStore";

const { subjects } = useSubjects();

const gateway = vi.hoisted(() => ({
  loadAllSubjects: vi.fn().mockReturnValue([]),
  createSubject: vi.fn(),
  deleteSubject: vi.fn(),
  updateSubject: vi.fn(),
}));

vi.mock("@/components/subjects/SubjectGateway", () => ({
  useSubjectGateway: () => {
    return {
      loadAllSubjects: gateway.loadAllSubjects,
      createSubject: gateway.createSubject,
      deleteSubject: gateway.deleteSubject,
      updateSubject: gateway.updateSubject,
    };
  },
}));

describe("SubjectManagement", () => {
  const wrapper = mount(SubjectManagement, {
    global: {
      plugins: [PrimeVue],
    },
  });

  subjects.value = [
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
  ];

  describe("given subjects", () => {
    it("should display subject in a list", () => {
      const listElements = wrapper.findAll("li");
      expect(listElements).toHaveLength(3);
    });
  });
});
