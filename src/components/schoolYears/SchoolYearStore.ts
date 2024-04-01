import { ref } from "vue";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";

const idCounter = ref(1);

const schoolYears = ref<SchoolYear[]>([
  {
    id: 0,
    firstSemesterStart: undefined,
    firstSemesterEnd: undefined,
    secondSemesterStart: undefined,
    secondSemesterEnd: undefined,
  },
]);

function addSchoolYear(schoolYearToAdd: SchoolYear, cleanup: () => void) {
  if (schoolYearToAdd.id && schoolYearToAdd.id > 0) {
    const index = schoolYears.value.findIndex((it) => {
      return it.id == schoolYearToAdd.id;
    });

    schoolYears.value.splice(index, 1, schoolYearToAdd);
  } else {
    schoolYears.value.push({
      ...schoolYearToAdd,
      id: idCounter.value,
    });

    idCounter.value++;
  }

  cleanup();
}

function format(item: SchoolYear) {
  return item.id === 0
    ? "Neues Schuljahr anlegen"
    : item.firstSemesterStart?.getFullYear() +
        "/" +
        item.secondSemesterEnd?.getFullYear();
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
    format,
    removeSchoolYear,
  };
}
