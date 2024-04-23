<script setup lang="ts">
import Dropdown from "primevue/dropdown";
import SelectButton from "primevue/selectbutton";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { computed, watch } from "vue";
import { useRouter } from "vue-router";

const { schoolYears, formatSchoolYear } = useSchoolYears();
const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

const semesters = computed(() => {
  return selectedSchoolYear.value?.id && selectedSchoolYear.value.id > 0
    ? [
        selectedSchoolYear.value.firstSemester,
        selectedSchoolYear.value.secondSemester,
      ]
    : undefined;
});

const router = useRouter();

watch(selectedSchoolYear, (current) => {
  if (current && current.id === 0) {
    router.push({ name: "schoolYearManagement", query: { index: 0 } });
    selectedSchoolYear.value = undefined;
  } else if (current && selectedSemester.value == undefined) {
    selectedSemester.value = current.firstSemester;
  }
});
</script>

<template>
  <dropdown
    v-model="selectedSchoolYear"
    :options="schoolYears"
    :option-label="formatSchoolYear"
    show-clear
    placeholder="Schuljahr auswählen"
    class="w-full"
  />
  <select-button
    v-model="selectedSemester"
    :options="semesters"
    :option-label="(option) => option.type + '. Semester'"
    data-key="type"
  />
</template>
