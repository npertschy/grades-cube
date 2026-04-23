<script setup lang="ts">
import { computed, ref } from "vue";
import PInputText from "primevue/inputtext";
import PDataTable from "primevue/datatable";
import PColumn from "primevue/column";
import PPanel from "primevue/panel";

const totalPoints = ref<string | null>(null);
const achievedPoints = ref<string | null>(null);

// Standard German 15-point system mapping
type GradeRow = {
  index: number;
  upperPercent: number;
  lowetPercent: number;
  upper: number;
  lower: number;
  gradePoint: number;
  grade: string;
};

const selectedRow = ref<GradeRow | null>(null);

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

const gradeTable = ref<GradeRow[]>([]);

function computeLimits() {
  if (!totalPoints.value || Number(totalPoints.value) <= 0) {
    gradeTable.value = [];
    return;
  }

  const rows: GradeRow[] = [];
  const total = Number(totalPoints.value);
  for (let i = 0; i < gradeMapping.length; i++) {
    const lower = Math.floor(total * (gradeMapping[i].lowetPercent / 100));
    const upper = Math.floor(total * (gradeMapping[i].upperPercent / 100));
    rows.push({
      index: i,
      upperPercent: gradeMapping[i].upperPercent,
      lowetPercent: gradeMapping[i].lowetPercent,
      upper: upper < 0 ? 0 : upper,
      lower: lower < 0 ? 0 : lower,
      gradePoint: gradeMapping[i].gradePoint,
      grade: gradeMapping[i].grade,
    });
  }
  // Ensure the lowest row lower limit is 0
  rows[rows.length - 1].lower = 0;
  gradeTable.value = rows;
}

function onPointsChange() {
  if (achievedPoints.value !== null && Number(achievedPoints.value) && totalPoints.value && Number(totalPoints.value)) {
    const points = Number(achievedPoints.value);
    const matchingRow = gradeTable.value.find((row) => row.upper >= points! && points >= row.lower);
    if (matchingRow) {
      selectedRow.value = matchingRow;
    } else {
      selectedRow.value = null;
    }
  } else {
    selectedRow.value = null;
  }
}

const achievedPointsSummary = computed(() => {
  if (selectedRow.value) {
    return `Notenpunkte: ${selectedRow.value.gradePoint}, Note: ${selectedRow.value.grade}`;
  }

  return "";
});
</script>

<template>
  <p-panel
    header="Notenrechner"
    style="max-width: 500px"
    :pt="{ content: { style: 'padding: 6px' } }"
  >
    <div>
      <div class="number-with-label">
        <label for="totalPoints">Gesamt:</label>
        <p-input-text
          v-model="totalPoints"
          input-id="totalPoints"
          inputmode="numeric"
          :min="0"
          :max="1000"
          @update:model-value="computeLimits"
        />
      </div>
      <div class="number-with-label">
        <label for="achievedPoints">Erreicht:</label>
        <p-input-text
          v-model="achievedPoints"
          input-id="achievedPoints"
          inputmode="numeric"
          :min="0"
          :max="totalPoints ? Number(totalPoints) : 0"
          @update:model-value="onPointsChange"
        />
      </div>
      <div class="number-with-label">
        <p>Ergibt:</p>
        <p style="width: 200px">
          {{ achievedPointsSummary }}
        </p>
      </div>
      <p-data-table
        v-model:selection="selectedRow"
        :value="gradeTable"
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
    </div>
  </p-panel>
</template>

<style>
.highlight-row {
  background-color: #ffe082 !important;
}

.number-with-label {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
</style>
