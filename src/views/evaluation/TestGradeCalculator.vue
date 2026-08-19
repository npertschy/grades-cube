<script setup lang="ts">
import { computed, ref } from "vue";
import PPanel from "primevue/panel";
import PDataTable from "primevue/datatable";
import PColumn from "primevue/column";
import GradeCalculatorForm from "./GradeCalculatorForm.vue";
import GradeResultLabel from "./GradeResultLabel.vue";

const totalPoints = ref<number | null>(null);
const achievedPoints = ref<number | null>(null);
const grammarPoints = ref<number | null>(null);
const includeGrammar = ref(false);

const gradeMapping = [
  { upperPercent: 100, lowetPercent: 95, gradePoint: 15, grade: "1+" },
  { upperPercent: 94, lowetPercent: 90, gradePoint: 14, grade: "1" },
  { upperPercent: 89, lowetPercent: 85, gradePoint: 13, grade: "1-" },
  { upperPercent: 84, lowetPercent: 80, gradePoint: 12, grade: "2+" },
  { upperPercent: 79, lowetPercent: 75, gradePoint: 11, grade: "2" },
  { upperPercent: 74, lowetPercent: 70, gradePoint: 10, grade: "2-" },
  { upperPercent: 69, lowetPercent: 65, gradePoint: 9, grade: "3+" },
  { upperPercent: 64, lowetPercent: 60, gradePoint: 8, grade: "3" },
  { upperPercent: 59, lowetPercent: 55, gradePoint: 7, grade: "3-" },
  { upperPercent: 54, lowetPercent: 50, gradePoint: 6, grade: "4+" },
  { upperPercent: 49, lowetPercent: 45, gradePoint: 5, grade: "4" },
  { upperPercent: 44, lowetPercent: 40, gradePoint: 4, grade: "4-" },
  { upperPercent: 39, lowetPercent: 35, gradePoint: 3, grade: "5+" },
  { upperPercent: 34, lowetPercent: 30, gradePoint: 2, grade: "5" },
  { upperPercent: 29, lowetPercent: 25, gradePoint: 1, grade: "5-" },
  { upperPercent: 24, lowetPercent: 0, gradePoint: 0, grade: "6" },
];

const gradeTable = computed(() => {
  if (!totalPoints.value || totalPoints.value <= 0) return [];
  const total = totalPoints.value;
  const rows = gradeMapping.map((m, index) => ({
    index,
    upperPercent: m.upperPercent,
    lowetPercent: m.lowetPercent,
    upper: Math.max(0, Math.floor(total * (m.upperPercent / 100))),
    lower: Math.max(0, Math.floor(total * (m.lowetPercent / 100))),
    gradePoint: m.gradePoint,
    grade: m.grade,
  }));
  rows[rows.length - 1].lower = 0;
  return rows;
});

// Single source of truth: the effective points used for lookup
const effectivePoints = computed(() => {
  if (achievedPoints.value === null) return null;
  const grammarAdjustment = includeGrammar.value ? (grammarPoints.value ?? 0) : 0;
  return achievedPoints.value + grammarAdjustment;
});

const matchingRow = computed(() => {
  if (effectivePoints.value === null) return null;
  const points = Math.floor(effectivePoints.value!);
  return gradeTable.value.find((row) => row.upper >= points && points >= row.lower) ?? null;
});
</script>

<template>
  <p-panel
    header="Notenrechner"
    style="width: 100%"
    :pt="{ content: { style: 'padding: 0.75rem' } }"
  >
    <grade-calculator-form
      v-model:total-points="totalPoints"
      v-model:achieved-points="achievedPoints"
      v-model:grammar-points="grammarPoints"
      v-model:include-grammar="includeGrammar"
    />

    <grade-result-label
      :achieved-points="effectivePoints"
      :grade-point="matchingRow?.gradePoint ?? null"
      :grade="matchingRow?.grade ?? null"
    />

    <p-data-table
      :value="gradeTable"
      :selection="matchingRow"
      size="small"
      show-gridlines
      row-hover
      selection-mode="single"
      data-key="index"
    >
      <p-column
        field="upperPercent"
        header="Von (%)"
      />
      <p-column
        field="lowetPercent"
        header="Bis (%)"
      />
      <p-column
        field="upper"
        header="Von"
      />
      <p-column
        field="lower"
        header="Bis"
      />
      <p-column
        field="gradePoint"
        header="Noten-punkte"
      />
      <p-column
        field="grade"
        header="Note"
      />
    </p-data-table>
  </p-panel>
</template>
