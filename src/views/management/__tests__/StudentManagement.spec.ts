import StudentManagement from "@/views/management/StudentManagement.vue";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

vi.mock("@/components/students/StudentGateway", () => {
  const StudentGateway = vi.fn(() => ({
    loadAllStudentsForSchoolYear: vi.fn().mockResolvedValue([
      {
        id: 1,
        firstName: "Max",
        lastName: "Mustermann",
        groups: undefined,
        courses: undefined,
      },
      {
        id: 2,
        firstName: "Thomas",
        lastName: "König",
        groups: undefined,
        courses: undefined,
      },
      {
        id: 3,
        firstName: "Klara",
        lastName: "Hamberger",
        groups: undefined,
        courses: undefined,
      },
    ]),
    loadGroupsAndCoursesForStudent: vi.fn().mockResolvedValue({
      id: 1,
      firstName: "Max",
      lastName: "Mustermann",
      groups: [],
      courses: [],
    }),
    createStudentInSchoolYear: vi.fn(),
    deleteStudentInSchoolYear: vi.fn(),
    loadGroupsForSchoolYear: vi.fn().mockResolvedValue([]),
    loadCoursesForSchoolYearAndSemester: vi.fn().mockResolvedValue([]),
  }));

  return { StudentGateway };
});

describe("StudentManagement", () => {
  useSchoolYearSelection().selectedSchoolYear.value = {
    id: 1,
    start: undefined,
    end: undefined,
    firstSemester: undefined,
    secondSemester: undefined,
  };

  useSchoolYearSelection().selectedSemester.value = {
    id: 1,
    type: 1,
    start: undefined,
    end: undefined,
  };

  const wrapper = mount(StudentManagement, {
    global: {
      plugins: [PrimeVue],
    },
  });

  describe("given students", () => {
    it("should display students in a list", () => {
      const listElements = wrapper.findAll("li[class='p-listbox-option']");

      expect(listElements).toHaveLength(4);
    });

    it("should display a default list entry as first item", () => {
      const listElements = wrapper.findAll("li[class='p-listbox-option']");
      const defaultElement = listElements.shift();
      expect(defaultElement?.text()).toEqual("Neuen Schüler anlegen");
    });

    it("should display the selected student in text input", async () => {
      const listElements = wrapper.findAll("li[class='p-listbox-option']");

      const studentItem = listElements.at(1);
      await studentItem?.trigger("click");
      await flushPromises();

      const labels = wrapper.findAll("label");
      const firstNameLabel = labels.find((label) => {
        return label.text() === "Vorname";
      });

      const inputSelector = `input[input-id="${firstNameLabel?.element.htmlFor}"]`;
      const firstNameInput = wrapper.find(inputSelector);

      expect(firstNameInput.attributes()["value"]).toEqual("Max");
    });
  });
});
