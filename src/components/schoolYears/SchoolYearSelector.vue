<script setup lang="ts">
import Dropdown from "primevue/dropdown";
import SelectButton from "primevue/selectbutton";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { computed } from "vue";

const { schoolYears, formatSchoolYear } = useSchoolYears();
const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

const semesters = computed(() => {
  return selectedSchoolYear.value?.id ?? 0 > 0
    ? [
        selectedSchoolYear.value?.firstSemester,
        selectedSchoolYear.value?.secondSemester,
      ]
    : undefined;
});
</script>

<template>
  <Dropdown
    v-model="selectedSchoolYear"
    :options="schoolYears"
    :option-label="formatSchoolYear"
    show-clear
    placeholder="Schuljahr auswählen"
    class="w-full"
  />
  <SelectButton
    v-model="selectedSemester"
    :options="semesters"
    :option-label="(option) => option.type + '. Semester'"
    data-key="type"
  />
</template>
