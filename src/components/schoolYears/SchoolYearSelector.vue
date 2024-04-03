<script setup lang="ts">
import Dropdown from "primevue/dropdown";
import SelectButton from "primevue/selectbutton";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { computed } from "vue";

const { schoolYears, formatSchoolYear } = useSchoolYears();
const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

const semesters = computed(() => {
  return selectedSchoolYear.value
    ? [
        selectedSchoolYear.value.firstSemester,
        selectedSchoolYear.value.secondSemester,
      ]
    : [];
});
</script>

<template>
  <Dropdown v-model="selectedSchoolYear" :options="schoolYears">
    <template #option="slotProps">
      <span class="w-full text-center">
        {{ formatSchoolYear(slotProps.option) }}
      </span>
    </template>
    <template #value="slotProps">
      <div v-if="slotProps.value">
        {{ formatSchoolYear(slotProps.value) }}
      </div>
      <span v-else>Schuljahr auswählen</span>
    </template>
  </Dropdown>
  <SelectButton
    v-model="selectedSemester"
    :options="semesters"
    :option-label="(option) => option.type + '. Semester'"
    data-key="type"
  />
</template>
