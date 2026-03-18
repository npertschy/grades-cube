<script setup lang="ts">
import { ref } from "vue";
import PInputText from "primevue/inputtext";
import PDataTable from "primevue/datatable";
import PColumn from "primevue/column";
import PPanel from "primevue/panel";

const totalPoints = ref<string | null>(null);
const achievedPoints = ref<string | null>(null);

// Standard German 15-point system mapping
type GradeRow = {
  index: number;
  upper: number;
  lower: number;
  gradePoint: number;
  grade: string;
};

const selectedRow = ref<GradeRow | null>(null);

const gradeMapping = [
  { gradePoint: 15, grade: "1+" },
  { gradePoint: 14, grade: "1" },
  { gradePoint: 13, grade: "1-" },
  { gradePoint: 12, grade: "2+" },
  { gradePoint: 11, grade: "2" },
  { gradePoint: 10, grade: "2-" },
  { gradePoint: 9, grade: "3+" },
  { gradePoint: 8, grade: "3" },
  { gradePoint: 7, grade: "3-" },
  { gradePoint: 6, grade: "4+" },
  { gradePoint: 5, grade: "4" },
  { gradePoint: 4, grade: "4-" },
  { gradePoint: 3, grade: "5+" },
  { gradePoint: 2, grade: "5" },
  { gradePoint: 1, grade: "5-" },
  { gradePoint: 0, grade: "6" },
];

const gradeTable = ref<GradeRow[]>([]);

function computeLimits() {
  if (!totalPoints.value || Number(totalPoints.value) <= 0) {
    gradeTable.value = [];
    return;
  }

  const rows: GradeRow[] = [];
  const total = Number(totalPoints.value);
  const step = total / gradeMapping.length;
  for (let i = 0; i < gradeMapping.length; i++) {
    const lower = Math.floor(total - step * (i + 1) + 1);
    const upper = Math.floor(total - step * i);
    rows.push({
      index: i,
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
</script>

<template>
  <p-panel
    header="Test Grade Calculator"
    style="max-width: 500px; margin: 0 auto"
    :pt="{ content: { style: 'padding: 3px' } }"
  >
    <div>
      <div class="number-with-label">
        <label for="totalPoints">Total Points:</label>
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
        <label for="achievedPoints">Points Achieved:</label>
        <p-input-text
          v-model="achievedPoints"
          input-id="achievedPoints"
          inputmode="numeric"
          :min="0"
          :max="totalPoints ? Number(totalPoints) : 0"
          @update:model-value="onPointsChange"
        />
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
        <PColumn
          field="upper"
          header="Upper Limit"
        />
        <PColumn
          field="lower"
          header="Lower Limit"
        />
        <PColumn
          field="gradePoint"
          header="Grade Points"
        />
        <PColumn
          field="grade"
          header="Grade"
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
