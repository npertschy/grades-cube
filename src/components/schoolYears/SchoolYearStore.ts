import { ref } from "vue";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";
import { loadAll, createSchoolYear, deleteSchoolYear, updateSchoolYear } from "./SchoolYearGateway";
import { useStoreErrorHandling } from "../errors/ErrorHandling";

const { runSafeWithThrow } = useStoreErrorHandling();

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
  let created: SchoolYear | undefined;
  await runSafeWithThrow(async () => {
    created = await createSchoolYear(schoolYearToAdd);
    await loadAllSchoolYears();
    cleanup();
  }, "Schuljahr konnte nicht gespeichert werden.");
  return created;
}

function formatSchoolYear(item: SchoolYear) {
  return item.id === 0 ? "Neues Schuljahr anlegen" : item.start?.getFullYear() + "/" + item.end?.getFullYear();
}

async function removeSchoolYear(schoolYear: SchoolYear) {
  await runSafeWithThrow(async () => {
    await deleteSchoolYear(schoolYear);
    await loadAllSchoolYears();
  }, "Schuljahr konnte nicht gelöscht werden.");
}

async function editSchoolYear(schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await updateSchoolYear(schoolYear);
    await loadAllSchoolYears();
    cleanup();
  }, "Schuljahr konnte nicht aktualisiert werden.");
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
