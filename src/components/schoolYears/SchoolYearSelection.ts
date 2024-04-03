import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import { ref } from "vue";

const selectedSchoolYear = ref<SchoolYear | undefined>();
const selectedSemester = ref<Semester | undefined>();

export function useSchoolYearSelection() {
  return {
    selectedSchoolYear,
    selectedSemester,
  };
}
