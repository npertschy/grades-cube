<script setup lang="ts">
import type { Performance } from "@/components/evaluations/Performance";
import PButton from "primevue/button";
import PColumn from "primevue/column";
import PColumnGroup from "primevue/columngroup";
import PDatatable from "primevue/datatable";
import PInputNumber from "primevue/inputnumber";
import PPanel from "primevue/panel";
import PRow from "primevue/row";
import PSlider from "primevue/slider";
import { computed, toRefs } from "vue";

interface Props {
  performances: Performance[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "update-performance", performance: Performance): void }>();

const { performances } = toRefs(props);

// derived lists (reactive)
const specialPerformances = computed(() => performances.value.filter((performance) => performance.type === 3));
const specialWeightsTotal = computed(() =>
  specialPerformances.value.reduce((acc, performance) => acc + (performance.weight ?? 0), 0).toString(),
);

const testPerformances = computed(() => performances.value.filter((performance) => performance.type === 6));
const testWeightsTotal = computed(() =>
  testPerformances.value.reduce((acc, performance) => acc + (performance.weight ?? 0), 0).toString(),
);

function findPerformanceOfType(type: number) {
  return performances.value.find((performance) => performance.type === type);
}

function updatePerformanceWeight(perf: Performance | undefined, weight: number) {
  if (!perf) return;
  const updated: Performance = { ...perf, weight };
  emit("update-performance", updated);
}

// computed getters/setters for two-way bindings
const oralOverallWeight = computed<number>({
  get: () => findPerformanceOfType(2)?.weight ?? 0,
  set: (val: number) => {
    const oral = findPerformanceOfType(2);
    const special = findPerformanceOfType(4);
    updatePerformanceWeight(oral, val);
    if (special) updatePerformanceWeight(special, 1 - val);
  },
});

const specialOverallWeight = computed<number>({
  get: () => findPerformanceOfType(4)?.weight ?? 0,
  set: (val: number) => {
    const special = findPerformanceOfType(4);
    const oral = findPerformanceOfType(2);
    updatePerformanceWeight(special, val);
    if (oral) updatePerformanceWeight(oral, 1 - val);
  },
});

const atOverallWeight = computed<number>({
  get: () => findPerformanceOfType(5)?.weight ?? 0,
  set: (val: number) => {
    const at = findPerformanceOfType(5);
    const test = findPerformanceOfType(7);
    updatePerformanceWeight(at, val);
    if (test) updatePerformanceWeight(test, 1 - val);
  },
});

const testOverallWeight = computed<number>({
  get: () => findPerformanceOfType(7)?.weight ?? 0,
  set: (val: number) => {
    const test = findPerformanceOfType(7);
    const at = findPerformanceOfType(5);
    updatePerformanceWeight(test, val);
    if (at) updatePerformanceWeight(at, 1 - val);
  },
});

function handleUpdateSpecialPerformanceWeight(value: number | number[]) {
  if (typeof value === "number") {
    specialOverallWeight.value = 1 - value;
  }
}

function handleUpdateTestPerformanceWeight(value: number | number[]) {
  if (typeof value === "number") {
    testOverallWeight.value = 1 - value;
  }
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
        :value="specialPerformances"
        size="small"
      >
        <p-column
          field="title"
          header="Titel"
          style="background-color: lightgreen"
        />
        <p-column
          field="weight"
          header="Gewichtung"
          style="background-color: lightgreen"
        />
        <p-column-group type="footer">
          <p-row>
            <p-column
              footer="Summe"
              :colspan="1"
            />
            <p-column :footer="specialWeightsTotal" />
          </p-row>
        </p-column-group>
      </p-datatable>
      <template #footer>
        <div style="display: grid; justify-content: end">
          <div>
            <p-button
              icon="pi pi-save"
              severity="secondary"
            />
            <p-button
              icon="pi pi-undo"
              severity="secondary"
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
        :value="testPerformances"
        size="small"
      >
        <template #header> </template>
        <p-column
          field="title"
          header="Titel"
          style="background-color: lightcoral"
        />
        <p-column
          field="weight"
          header="Gewichtung"
          style="background-color: lightcoral"
        />
        <p-column-group type="footer">
          <p-row>
            <p-column
              footer="Summe"
              :colspan="1"
            />
            <p-column :footer="testWeightsTotal" />
          </p-row>
        </p-column-group>
      </p-datatable>
      <template #footer>
        <div style="display: grid; justify-content: end">
          <div>
            <p-button
              icon="pi pi-save"
              severity="secondary"
            />
            <p-button
              icon="pi pi-undo"
              severity="secondary"
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
        <p-input-number
          v-model="oralOverallWeight"
          show-buttons
          button-layout="vertical"
          :step="0.01"
          @value-change="(value) => (specialOverallWeight = 1 - value)"
        />
        <p-slider
          v-model="oralOverallWeight"
          :min="0"
          :max="1"
          :step="0.01"
          @change="handleUpdateSpecialPerformanceWeight"
        />
        <p-input-number
          v-model="specialOverallWeight"
          show-buttons
          button-layout="vertical"
          :step="0.01"
          @value-change="(value) => (oralOverallWeight = 1 - value)"
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
        <p-input-number
          v-model="atOverallWeight"
          show-buttons
          button-layout="vertical"
          :step="0.01"
          @value-change="(value) => (testOverallWeight = 1 - value)"
        />
        <p-slider
          v-model="atOverallWeight"
          :min="0"
          :max="1"
          :step="0.01"
          @change="handleUpdateTestPerformanceWeight"
        />
        <p-input-number
          v-model="testOverallWeight"
          show-buttons
          button-layout="vertical"
          :step="0.01"
          @value-change="(value) => (atOverallWeight = 1 - value)"
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
