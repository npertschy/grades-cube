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
  try {
    await createSchoolYear(schoolYearToAdd);
    await loadAllSchoolYears();
    cleanup();
  } catch (e) {
    throw new Error("Schuljahr konnte nicht gespeichert werden.", { cause: e });
  }
}

function formatSchoolYear(item: SchoolYear) {
  return item.id === 0 ? "Neues Schuljahr anlegen" : item.start?.getFullYear() + "/" + item.end?.getFullYear();
}

async function removeSchoolYear(schoolYear: SchoolYear) {
  try {
    await deleteSchoolYear(schoolYear);
    await loadAllSchoolYears();
  } catch (e) {
    throw new Error("Schuljahr konnte nicht gelöscht werden.", { cause: e });
  }
}

async function editSchoolYear(schoolYear: SchoolYear, cleanup: () => void) {
  try {
    await updateSchoolYear(schoolYear);
    await loadAllSchoolYears();
    cleanup();
  } catch (e) {
    throw new Error("Schuljahr konnte nicht aktualisiert werden.", { cause: e });
  }
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
