<script setup lang="ts">
defineProps<{
  achievedPoints: number | null;
  gradePoint: number | null;
  grade: string | null;
}>();
</script>

<template>
  <div class="result">
    <span class="result-value">
      Punkte: {{ achievedPoints }} · Notenpunkte: {{ gradePoint }} · Note: {{ grade }}
    </span>
  </div>
</template>

<style scoped>
.result {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--p-border-radius-md);
}

.result-label {
  font-weight: 600;
  white-space: nowrap;
}

.result-value {
  overflow-wrap: anywhere;
}
</style>
