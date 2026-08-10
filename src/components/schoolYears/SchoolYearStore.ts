import { ref } from "vue";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";
import { loadAll, createSchoolYear, deleteSchoolYear, updateSchoolYear } from "./SchoolYearGateway";

const schoolYears = ref<SchoolYear[]>([]);

async function loadAllSchoolYears() {
  schoolYears.value.length = 0;

  const all = await loadAll();
  schoolYears.value.push(
    {
      id: 0,
      start: undefined,
      end: undefined,
      firstSemester: undefined,
      secondSemester: undefined,
    },
    ...all,
  );
}

async function addSchoolYear(schoolYearToAdd: SchoolYear, cleanup: () => void) {
  await createSchoolYear(schoolYearToAdd);
  await loadAll();

  cleanup();
}

function formatSchoolYear(item: SchoolYear) {
  return item.id === 0 ? "Neues Schuljahr anlegen" : item.start?.getFullYear() + "/" + item.end?.getFullYear();
}

async function removeSchoolYear(schoolYear: SchoolYear) {
  await deleteSchoolYear(schoolYear);
  await loadAll();
}

async function editSchoolYear(schoolYear: SchoolYear, cleanup: () => void) {
  await updateSchoolYear(schoolYear);
  await loadAll();

  cleanup();
}

export function useSchoolYears() {
  return {
    schoolYears,
    loadAllSchoolYears,
    addSchoolYear,
    editSchoolYear,
    formatSchoolYear,
    removeSchoolYear,
  };
}
