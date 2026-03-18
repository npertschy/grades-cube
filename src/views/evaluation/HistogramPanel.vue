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

const options = computed(() => {
  if (selectedColumn.value) {
    const performance = performances.value.find((performance) => performance.id === selectedColumn.value);
    if (performance) {
      if (performance.type === 0) {
        return {
          maintainAspectRatio: false,
          scales: { y: { ticks: { stepSize: 1 } } },
        };
      } else {
        return {
          maintainAspectRatio: false,
          scales: {
            y: { ticks: { stepSize: 1 } },
            x: {
              reverse: true,
            },
          },
        };
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

  const documentStyle = getComputedStyle(document.documentElement);
  const borderColor = documentStyle.getPropertyValue("--p-primary-color");
  const backgroundColor = documentStyle.getPropertyValue("--p-highlight-focus-background");

  return {
    labels,
    datasets: [
      {
        label: label,
        data: histogram,
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        borderWidth: 2,
      },
    ],
  };
}

function chartDataForNonOralPerformance(performance: Performance) {
  const grades = students.value
    .map((student) => student.grades.get(performance.performanceId!)?.value)
    .filter((grade) => grade !== undefined)
    .filter((grade) => grade !== null)
    .filter((grade) => grade != "")
    .map((grade) => Number(grade));

  const gradeLabels = Array.from({ length: 16 }, (_, i) => i);

  // Foreground: frequency per grade
  const gradeCounts = gradeLabels.map((label) => grades.filter((g) => g === label).length);

  const grouped = grades.map((grade) => {
    if (grade >= 13) return 14;
    if (grade >= 10) return 11;
    if (grade >= 7) return 8;
    if (grade >= 4) return 5;
    if (grade >= 1) return 2;
    return null;
  });

  const combinedLabels = Array.from({ length: 16 }, (_, i) => i);
  const backgroundData = combinedLabels.map((group) => grouped.filter((g) => g === group).length);

  const documentStyle = getComputedStyle(document.documentElement);
  const borderColor = documentStyle.getPropertyValue("--p-primary-color");
  const backgroundColor = documentStyle.getPropertyValue("--p-highlight-focus-background");

  return {
    labels: gradeLabels,
    datasets: [
      {
        label: "Notenpunkte (15-0)",
        backgroundColor: borderColor,
        data: gradeCounts,
        grouped: false,
      },
      {
        label: "Noten (1–6)",
        data: backgroundData,
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        borderWidth: 2,
        barPercentage: 3.5,
        grouped: false,
      },
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
