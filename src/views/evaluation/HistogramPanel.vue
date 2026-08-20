<script setup lang="ts">
import { toRef } from "vue";
import PDrawer from "primevue/drawer";
import PChart from "primevue/chart";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { EvaluatedStudent } from "@/components/evaluations/EvaluatedStudent";
import { type Performance } from "@/components/evaluations/Performance";
import { useHistogramChart } from "@/components/evaluations/HistogramData";

const props = defineProps<{
  showChartForPerformance: boolean;
  selectedColumn: number | undefined;
  performances: Performance[];
  students: EvaluatedStudent[];
}>();

const { titleOfGradeChart, chartData, options } = useHistogramChart({
  selectedColumn: toRef(props, "selectedColumn"),
  performances: toRef(props, "performances"),
  students: toRef(props, "students"),
});
</script>

<template>
  <div>
    <p-drawer
      :visible="showChartForPerformance"
      position="bottom"
      :header="titleOfGradeChart"
      :modal="false"
      :dismissable="false"
      :show-close-icon="false"
      style="height: 35%"
    >
      <p-chart
        v-if="selectedColumn"
        type="bar"
        :data="chartData"
        :plugins="[ChartDataLabels]"
        :options="options"
        style="height: 100%"
      />
    </p-drawer>
  </div>
</template>
