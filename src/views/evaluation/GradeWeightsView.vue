<script setup lang="ts">
import { PerformanceType, type Performance } from "@/components/evaluations/Performance";
import StepperInput from "@/components/layout/StepperInput.vue";
import PButton from "primevue/button";
import PColumn from "primevue/column";
import PColumnGroup from "primevue/columngroup";
import PDatatable from "primevue/datatable";
import PInputNumber from "primevue/inputnumber";
import PPanel from "primevue/panel";
import PRow from "primevue/row";
import PSlider from "primevue/slider";
import { computed, ref, watch } from "vue";

const SCALE = 100;

const { performances } = defineProps<{
  performances: Performance[];
}>();
const emit = defineEmits<{
  (e: "update-performances", performances: Performance[]): void;
  (e: "on-invalid-weights", invalid: boolean): void;
}>();

const specialPerformances = computed(() =>
  performances.filter((performance) => performance.type === PerformanceType.SPECIAL),
);

const writtenPerformances = computed(() =>
  performances.filter((performance) => performance.type === PerformanceType.WRITTEN),
);

const localSpecial = ref<Performance[]>([]);
const localWritten = ref<Performance[]>([]);

function cleanSetSpecialPerformances() {
  localSpecial.value = specialPerformances.value.map((performance) => ({ ...performance }));
}

function cleanSetWrittenPerformances() {
  localWritten.value = writtenPerformances.value.map((performance) => ({ ...performance }));
}

watch(
  () => performances,
  () => {
    cleanSetSpecialPerformances();
    cleanSetWrittenPerformances();
  },
  { immediate: true, deep: true },
);

const specialWeightsTotal = computed(() =>
  (localSpecial.value.reduce((acc, performance) => acc + (performance.weight ?? 0) * SCALE, 0) / SCALE).toString(),
);
const specialWeightsTotalValid = computed(() => specialWeightsTotal.value === "1");

const writtenWeightsTotal = computed(() =>
  (localWritten.value.reduce((acc, performance) => acc + (performance.weight ?? 0) * SCALE, 0) / SCALE).toString(),
);
const writtenWeightsTotalValid = computed(() => writtenWeightsTotal.value === "1");

function saveSpecialWeights() {
  emit("update-performances", localSpecial.value);
}

function saveWrittenWeights() {
  emit("update-performances", localWritten.value);
}

function onWeightEditComplete(event: { data: Performance; newValue: unknown; field: string }) {
  const { data, newValue, field } = event;
  const parsed = typeof newValue === "number" ? newValue : Number(newValue);
  if (field === "weight" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
    data.weight = parsed;
  }
}

function findPerformanceOfType(type: PerformanceType) {
  return performances.find((performance) => performance.type === type);
}

const oralOverallWeight = ref(0);
const specialOverallWeight = ref(0);
const atOverallWeight = ref(0);
const writtenOverallWeight = ref(0);

watch(
  () => performances,
  () => {
    oralOverallWeight.value = findPerformanceOfType(PerformanceType.ORAL_OVERALL)?.weight ?? 0;
    specialOverallWeight.value = findPerformanceOfType(PerformanceType.SPECIAL_OVERALL)?.weight ?? 0;
    atOverallWeight.value = findPerformanceOfType(PerformanceType.AT_OVERALL)?.weight ?? 0;
    writtenOverallWeight.value = findPerformanceOfType(PerformanceType.WRITTEN_OVERALL)?.weight ?? 0;
  },
  { immediate: true, deep: true },
);

function handleOralInput(value: number) {
  oralOverallWeight.value = value;
  specialOverallWeight.value = (SCALE - value * SCALE) / SCALE;
}

function handleSpecialInput(value: number) {
  specialOverallWeight.value = value;
  oralOverallWeight.value = (SCALE - value * SCALE) / SCALE;
}

function handleAtInput(value: number) {
  atOverallWeight.value = value;
  writtenOverallWeight.value = (SCALE - value * SCALE) / SCALE;
}

function handleWrittenInput(value: number) {
  writtenOverallWeight.value = value;
  atOverallWeight.value = (SCALE - value * SCALE) / SCALE;
}

function commitOralSpecialWeights() {
  const oralPerf = findPerformanceOfType(PerformanceType.ORAL_OVERALL);
  const specialPerf = findPerformanceOfType(PerformanceType.SPECIAL_OVERALL);
  if (!oralPerf || !specialPerf) return;

  const toUpdate = [
    { ...oralPerf, weight: oralOverallWeight.value },
    { ...specialPerf, weight: specialOverallWeight.value },
  ];
  emit("update-performances", toUpdate);
}

function commitAtWrittenWeights() {
  const atPerf = findPerformanceOfType(PerformanceType.AT_OVERALL);
  const writtenPerf = findPerformanceOfType(PerformanceType.WRITTEN_OVERALL);
  if (!atPerf || !writtenPerf) return;

  const toUpdate = [
    { ...atPerf, weight: atOverallWeight.value },
    { ...writtenPerf, weight: writtenOverallWeight.value },
  ];
  emit("update-performances", toUpdate);
}

function handleOralSliderInput(value: number | number[]) {
  if (typeof value === "number") handleOralInput(value);
}

function handleAtSliderInput(value: number | number[]) {
  if (typeof value === "number") handleAtInput(value);
}

function handleOralInputChange(value: number) {
  handleOralInput(value);
  commitOralSpecialWeights();
}

function handleSpecialInputChange(value: number) {
  handleSpecialInput(value);
  commitOralSpecialWeights();
}

function handleAtInputChange(value: number) {
  handleAtInput(value);
  commitAtWrittenWeights();
}

function handleWrittenInputChange(value: number) {
  handleWrittenInput(value);
  commitAtWrittenWeights();
}

const specialSumStyle = computed(() => {
  return specialWeightsTotalValid.value ? {} : { color: "var(--p-message-error-simple-color)" };
});

const writtenSumStyle = computed(() => {
  return writtenWeightsTotalValid.value ? {} : { color: "var(--p-message-error-simple-color)" };
});

watch(
  [specialWeightsTotalValid, writtenWeightsTotalValid],
  ([specialValid, writtenValid]) => {
    emit("on-invalid-weights", !specialValid || !writtenValid);
  },
  { immediate: true },
);

function equalWeights(performances: Performance[]) {
  const equalWeight = SCALE / performances.length;
  const isInfinite = Math.trunc(equalWeight) !== equalWeight;
  performances.forEach((performance, index) => {
    const adjustment = isInfinite && index === 0 ? 1 : 0;
    performance.weight = (Math.trunc(equalWeight) + adjustment) / SCALE;
  });
}
</script>

<template>
  <p-panel header="Notengewichtung">
    <p-panel
      header="Besondere Leistungen"
      toggleable
      class="margin-padding"
    >
      <p-datatable
        :value="localSpecial"
        size="small"
        edit-mode="cell"
        @cell-edit-complete="onWeightEditComplete"
      >
        <p-column
          field="title"
          header="Titel"
          style="background-color: var(--p-performance-special-background)"
        />
        <p-column
          field="weight"
          header="Gewichtung"
          style="background-color: var(--p-performance-special-background); width: 8rem"
        >
          <template #body="{ data }">
            {{ data.weight }}
          </template>
          <template #editor="{ data }">
            <p-input-number
              v-model="data.weight"
              :min="0"
              :max="1"
              :step="0.01"
              :min-fraction-digits="0"
              :max-fraction-digits="2"
              locale="de-DE"
              :input-style="{ width: '6rem' }"
              style="width: 100%; padding-top: 3px; padding-bottom: 3px"
            />
          </template>
        </p-column>
        <p-column-group type="footer">
          <p-row>
            <p-column
              footer="Summe"
              :colspan="1"
              :footer-style="specialSumStyle"
            />
            <p-column
              :footer="specialWeightsTotal"
              :footer-style="specialSumStyle"
            />
          </p-row>
        </p-column-group>
      </p-datatable>
      <template #footer>
        <div style="display: grid; justify-content: end">
          <div>
            <p-button
              v-tooltip.bottom="'Gewichte angleichen'"
              icon="pi pi-equals"
              severity="secondary"
              @click="equalWeights(localSpecial)"
            />
            <p-button
              v-tooltip.bottom="'Gewichte speichern'"
              icon="pi pi-save"
              severity="secondary"
              :disabled="!specialWeightsTotalValid"
              @click="saveSpecialWeights"
            />
            <p-button
              v-tooltip.bottom="'Gewichte zurücksetzen'"
              icon="pi pi-undo"
              severity="secondary"
              @click="cleanSetSpecialPerformances"
            />
          </div>
        </div>
      </template>
    </p-panel>
    <p-panel
      header="Schriftliche Leistungen"
      toggleable
      class="margin-padding"
    >
      <p-datatable
        :value="localWritten"
        size="small"
        edit-mode="cell"
        @cell-edit-complete="onWeightEditComplete"
      >
        <template #header> </template>
        <p-column
          field="title"
          header="Titel"
          style="background-color: var(--p-performance-test-background)"
        />
        <p-column
          field="weight"
          header="Gewichtung"
          style="background-color: var(--p-performance-test-background); width: 8rem"
        >
          <template #body="{ data }">
            {{ data.weight }}
          </template>
          <template #editor="{ data }">
            <p-input-number
              v-model="data.weight"
              :min="0"
              :max="1"
              :step="0.01"
              :min-fraction-digits="0"
              :max-fraction-digits="2"
              locale="de-DE"
              :input-style="{ width: '6rem' }"
              style="width: 100%; padding-top: 3px; padding-bottom: 3px"
            />
          </template>
        </p-column>
        <p-column-group type="footer">
          <p-row>
            <p-column
              footer="Summe"
              :colspan="1"
              :footer-style="writtenSumStyle"
            />
            <p-column
              :footer="writtenWeightsTotal"
              :footer-style="writtenSumStyle"
            />
          </p-row>
        </p-column-group>
      </p-datatable>
      <template #footer>
        <div style="display: grid; justify-content: end">
          <div>
            <p-button
              v-tooltip.bottom="'Gewichte angleichen'"
              icon="pi pi-equals"
              severity="secondary"
              @click="equalWeights(localWritten)"
            />
            <p-button
              v-tooltip.bottom="'Gewichte speichern'"
              icon="pi pi-save"
              severity="secondary"
              :disabled="!writtenWeightsTotalValid"
              @click="saveWrittenWeights"
            />
            <p-button
              v-tooltip.bottom="'Gewichte zurücksetzen'"
              icon="pi pi-undo"
              severity="secondary"
              @click="cleanSetWrittenPerformances"
            />
          </div>
        </div>
      </template>
    </p-panel>
    <p-panel
      header="Allgemeiner Teil"
      toggleable
      class="margin-padding"
    >
      <div
        style="
          display: grid;
          grid-template-columns: 4rem 6rem 4rem;
          justify-content: space-between;
          align-items: center;
        "
      >
        <stepper-input
          v-model="oralOverallWeight"
          icon="pi pi-comment"
          @at-input-change="handleOralInputChange"
        />
        <p-slider
          v-model="oralOverallWeight"
          :min="0"
          :max="1"
          :step="0.01"
          @update:model-value="handleOralSliderInput"
          @slideend="commitOralSpecialWeights"
        />
        <stepper-input
          v-model="specialOverallWeight"
          icon="pi pi-star"
          @at-input-change="handleSpecialInputChange"
        />
      </div>
    </p-panel>
    <p-panel
      header="Gesamtnote"
      toggleable
    >
      <div
        style="
          display: grid;
          grid-template-columns: 4rem 6rem 4rem;
          justify-content: space-between;
          align-items: center;
        "
      >
        <stepper-input
          v-model="atOverallWeight"
          icon="pi pi-box"
          @at-input-change="handleAtInputChange"
        />
        <p-slider
          v-model="atOverallWeight"
          :min="0"
          :max="1"
          :step="0.01"
          @update:model-value="handleAtSliderInput"
          @slideend="commitAtWrittenWeights"
        />
        <stepper-input
          v-model="writtenOverallWeight"
          icon="pi pi-file"
          @at-input-change="handleWrittenInputChange"
        />
      </div>
    </p-panel>
  </p-panel>
</template>

<style scoped>
.margin-padding {
  margin-bottom: 1rem;
}
</style>
