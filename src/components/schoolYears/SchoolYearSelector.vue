<script setup lang="ts">
import PSelect from "primevue/select";
import SelectButton from "primevue/selectbutton";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import store from "@/store/KeyValueStore";
import type { Semester } from "@/components/schoolYears/Semester";

const { schoolYears, formatSchoolYear } = useSchoolYears();
const { selectedSchoolYear, selectedSemester } = useSchoolYearSelection();

onMounted(async () => {
  const id = await store.get("selectedSchoolYear");
  selectedSchoolYear.value = schoolYears.value.find((schoolYear) => {
    return schoolYear.id === id;
  });
  if (selectedSchoolYear.value) {
    const type = (await store.get("selectedSemester")) ?? undefined;
    selectedSemester.value =
      type === 1 ? selectedSchoolYear.value.firstSemester : selectedSchoolYear.value.secondSemester;
  }
});

const semesters = computed(() => {
  return selectedSchoolYear.value?.id && selectedSchoolYear.value.id > 0
    ? [selectedSchoolYear.value.firstSemester, selectedSchoolYear.value.secondSemester]
    : undefined;
});

const router = useRouter();

watch(selectedSchoolYear, async (current) => {
  if (current && current.id === 0) {
    router.push({ name: "schoolYearManagement", query: { index: 0 } });
    selectedSchoolYear.value = undefined;
  } else if (current && selectedSemester.value == undefined) {
    selectedSemester.value = current.firstSemester;
    await store.set("selectedSchoolYear", current.id);
    await store.set("selectedSemester", selectedSemester.value?.type);
  }
});

watch(selectedSemester, async (current) => {
  await store.set("selectedSemester", current?.type);
});
</script>

<template>
  <p-select
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
    :option-label="(option: Semester) => option.type + '. Semester'"
    data-key="type"
  />
</template>
