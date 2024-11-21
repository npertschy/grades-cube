<script setup lang="ts">
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";

const { selectedSchoolYear } = defineProps<{
  selectedSchoolYear?: SchoolYear;
}>();
</script>

<template>
  <div v-if="selectedSchoolYear">
    <slot />
  </div>
  <div v-else>
    <p style="display: grid; place-items: center">Wählen Sie ein Schuljahr aus der Liste oben rechts aus.</p>
  </div>
</template>
