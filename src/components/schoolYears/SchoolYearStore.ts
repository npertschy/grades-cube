import { ref } from "vue";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";
import { loadAll, createSchoolYear } from "./SchoolYearGateway";

const schoolYears = ref<SchoolYear[]>([
  {
    id: 0,
    start: undefined,
    end: undefined,
    firstSemester: undefined,
    secondSemester: undefined,
  },
]);

const all = await loadAll();
all.forEach((loaded) => {
  schoolYears.value.push(loaded);
});

async function addSchoolYear(schoolYearToAdd: SchoolYear, cleanup: () => void) {
  if (schoolYearToAdd.id && schoolYearToAdd.id > 0) {
    const index = schoolYears.value.findIndex((it) => {
      return it.id == schoolYearToAdd.id;
    });

    schoolYears.value.splice(index, 1, schoolYearToAdd);
  } else {
    await createSchoolYear(schoolYearToAdd);
    schoolYears.value = [...(await loadAll())];
    schoolYears.value.unshift({
      id: 0,
      start: undefined,
      end: undefined,
      firstSemester: undefined,
      secondSemester: undefined,
    });
  }

  cleanup();
}

function formatSchoolYear(item: SchoolYear) {
  return item.id === 0
    ? "Neues Schuljahr anlegen"
    : item.start?.getFullYear() + "/" + item.end?.getFullYear();
}

function removeSchoolYear(schoolYear: SchoolYear) {
  const index = schoolYears.value.findIndex((it) => {
    return it.id == schoolYear.id;
  });

  schoolYears.value.splice(index, 1);
}

export function useSchoolYears() {
  return {
    schoolYears,
    addSchoolYear,
    formatSchoolYear,
    removeSchoolYear,
  };
}
