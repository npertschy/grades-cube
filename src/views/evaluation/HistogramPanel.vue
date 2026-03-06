<script setup lang="ts">
import { computed, toRefs } from "vue";
import PDrawer from "primevue/drawer";
import PChart from "primevue/chart";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { EvaluatedStudent } from "@/components/evaluations/EvaluatedStudent";
import type { Performance } from "@/components/evaluations/Performance";

interface Props {
  showChartForPerformance: boolean;
  selectedColumn: number | undefined;
  performances: Performance[];
  students: EvaluatedStudent[];
}

const props = defineProps<Props>();

const { showChartForPerformance, selectedColumn, performances, students } = toRefs(props);

const titleOfGradeChart = computed(() => {
  if (selectedColumn.value) {
    const name = performances.value.find((performance) => performance.id === selectedColumn.value)?.title;

    return `Notenübersicht für ${name}`;
  } else {
    return "Klicken Sie auf eine Leistung, um die Notenübersicht zu sehen.";
  }
});

const chartData = computed(() => {
  if (selectedColumn.value) {
    const performance = performances.value.find((performance) => performance.id === selectedColumn.value);
    if (performance) {
      if (performance.type === 0) {
        return chartDataForOralPerformance(performance);
      } else {
        return chartDataForNonOralPerformance(performance);
      }
    }
  }

  return {};
});

function chartDataForOralPerformance(performance: Performance) {
  const labels = ["++", "+", "0", "-", "--", "f"];
  const grades = students.value
    .map((student) => student.grades.get(performance.performanceId!)?.value)
    .filter((grade) => grade !== undefined)
    .filter((grade) => grade !== null)
    .filter((grade) => grade != "") as string[];
  const histogram: number[] = [];
  labels.forEach((label) => {
    histogram.push(grades.filter((grade) => grade === label).length);
  });

  const average = histogram.reduce((acc, grade, index) => acc + grade * (index + 1), 0) / grades.length;

  const label = `Notenverteilung für ${performance.title} und ${grades.length} bewertete Schüler - Durchschnitt: ${labels[Math.floor(average) - 1]}`;

  return {
    labels,
    datasets: [
      {
        label: label,
        data: histogram,
        borderColor: "rgba(8, 145, 178, 0.5)",
        backgroundColor: "rgba(236, 254, 255, 1)",
        borderWidth: 2,
      },
    ],
  };
}

function chartDataForNonOralPerformance(performance: Performance) {
  const labels = Array.from({ length: 16 }, (_, i) => i.toString()).reverse();
  const grades = students.value
    .map((student) => student.grades.get(performance.performanceId!)?.value)
    .filter((grade) => grade !== undefined)
    .filter((grade) => grade !== null)
    .filter((grade) => grade != "") as string[];

  const histogram: number[] = [];
  labels.forEach((label) => {
    histogram.push(grades.filter((grade) => grade === label).length);
  });

  const groupedLabels = ["1", "2", "3", "4", "5", "6"];
  const groupedHistogram: number[] = [0, 0, 0, 0, 0, 0];
  grades.forEach((grade) => {
    if (grade > "12") {
      groupedHistogram[0] += 1;
    } else if (grade <= "12" && grade > "9") {
      groupedHistogram[1] += 1;
    } else if (grade <= "9" && grade > "6") {
      groupedHistogram[2] += 1;
    } else if (grade <= "6" && grade > "3") {
      groupedHistogram[3] += 1;
    } else if (grade <= "3" && grade > "0") {
      groupedHistogram[4] += 1;
    } else {
      groupedHistogram[5] += 1;
    }
  });

  const average = histogram.reduce((acc, grade, index) => acc + grade * (16 - index), 0) / grades.length;
  const groupedAverage = groupedHistogram.reduce((acc, grade, index) => acc + (index + 1) * grade, 0) / grades.length;

  let label = `Notenverteilung für ${performance.title} und ${grades.length} bewertete Schüler`;
  label += ` - (Durchschnitt: ${average.toFixed(2)})`;

  let groupedLabel = `Notenverteilung für ${performance.title} und ${grades.length} bewertete Schüler`;
  groupedLabel += ` - (Durchschnitt: ${groupedAverage.toFixed(2)})`;

  return {
    labels,
    datasets: [
      {
        xAxisID: "bla",
        label: label,
        data: histogram,
        borderColor: "rgba(8, 145, 178, 0.5)",
        backgroundColor: "rgba(236, 254, 255, 1)",
        borderWidth: 2,
      },
      // {
      //   label: groupedLabel,
      //   data: groupedHistogram,
      //   borderColor: "rgba(7, 79, 79, 0.5)",
      //   backgroundColor: "rgba(179, 183, 112, 1)",
      //   borderWidth: 2,
      // },
    ],
  };
}
</script>

<template>
  <div>
    <p-drawer
      v-model:visible="showChartForPerformance"
      position="bottom"
      :header="titleOfGradeChart"
      :modal="false"
      :dismissable="false"
      :show-close-icon="false"
      style="height: 35%"
    >
      <p-chart
        type="bar"
        :data="chartData"
        :plugins="[ChartDataLabels]"
        :options="{
          maintainAspectRatio: false,
          scales: { y: { ticks: { stepSize: 1 } } },
        }"
        style="height: 100%"
      />
    </p-drawer>
  </div>
</template>
