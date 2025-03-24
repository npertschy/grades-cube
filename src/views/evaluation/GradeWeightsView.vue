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
import { ref, toRefs } from "vue";

interface Props {
  performances: Performance[];
}

const props = defineProps<Props>();

const { performances } = toRefs(props);

const specialPerformances = ref(performances.value.filter((performance) => performance.type === 3));
const specialWeightsTotal = specialPerformances.value
  .reduce((acc, performance) => acc + performance.weight, 0)
  .toString();

const testPerformances = ref(performances.value.filter((performance) => performance.type === 6));
const testWeightsTotal = testPerformances.value.reduce((acc, performance) => acc + performance.weight, 0).toString();

const oralOverallPerformance = ref(findPerformanceOfType(2));
const specialOverallPerformance = ref(findPerformanceOfType(4));

const atOverallPerformance = ref(findPerformanceOfType(5));
const testOverallPerformance = ref(findPerformanceOfType(7));

function findPerformanceOfType(type: number) {
  return performances.value.find((performance) => performance.type === type) ?? { weight: 0 };
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
          v-model="oralOverallPerformance.weight"
          show-buttons
          button-layout="vertical"
          :step="0.01"
          @value-change="(value) => (specialOverallPerformance.weight = 1 - value)"
        />
        <p-slider
          v-model="oralOverallPerformance.weight"
          :min="0"
          :max="1"
          :step="0.01"
          @change="(value) => (specialOverallPerformance.weight = 1 - value)"
        />
        <p-input-number
          v-model="specialOverallPerformance.weight"
          show-buttons
          button-layout="vertical"
          :step="0.01"
          @value-change="(value) => (oralOverallPerformance.weight = 1 - value)"
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
          v-model="atOverallPerformance.weight"
          show-buttons
          button-layout="vertical"
          :step="0.01"
          @value-change="(value) => (testOverallPerformance.weight = 1 - value)"
        />
        <p-slider
          v-model="atOverallPerformance.weight"
          :min="0"
          :max="1"
          :step="0.01"
          @change="(value) => (testOverallPerformance.weight = 1 - value)"
        />
        <p-input-number
          v-model="testOverallPerformance.weight"
          show-buttons
          button-layout="vertical"
          :step="0.01"
          @value-change="(value) => (atOverallPerformance.weight = 1 - value)"
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
