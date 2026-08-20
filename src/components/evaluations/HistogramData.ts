import { computed, type Ref } from "vue";
import type { EvaluatedStudent } from "@/components/evaluations/EvaluatedStudent";
import { PerformanceType, type Performance } from "@/components/evaluations/Performance";

interface UseHistogramChartOptions {
  selectedColumn: Ref<number | undefined>;
  performances: Ref<Performance[]>;
  students: Ref<EvaluatedStudent[]>;
}

export function useHistogramChart({ selectedColumn, performances, students }: UseHistogramChartOptions) {
  const selectedPerformance = computed(() => performances.value.find((p) => p.id === selectedColumn.value));

  const titleOfGradeChart = computed(() => {
    if (!selectedColumn.value) {
      return "Klicken Sie auf eine Leistung, um die Notenübersicht zu sehen.";
    }
    return `Notenübersicht für ${selectedPerformance.value?.title}`;
  });

  const chartData = computed(() => {
    const performance = selectedPerformance.value;
    if (!performance) return {};

    return performance.type === PerformanceType.ORAL
      ? chartDataForOralPerformance(performance, performances.value, students.value)
      : chartDataForNonOralPerformance(performance, performances.value, students.value);
  });

  const options = computed(() => {
    const performance = selectedPerformance.value;
    if (!performance) return {};

    return performance.type === PerformanceType.ORAL
      ? {
          maintainAspectRatio: false,
          scales: { y: { ticks: { stepSize: 1 } } },
        }
      : {
          maintainAspectRatio: false,
          scales: { y: { ticks: { stepSize: 1 } }, x: { reverse: true } },
        };
  });

  return { titleOfGradeChart, chartData, options };
}

function filterForValidGrades(performance: Performance, performances: Performance[], students: EvaluatedStudent[]) {
  const colIndex = performances.findIndex((p) => p.id === performance.id);
  return students
    .map((student) => student.grades[colIndex]?.value)
    .filter((grade) => grade !== undefined)
    .filter((grade) => grade !== null)
    .filter((grade) => grade != "");
}

function computeHistogram<T>(grades: T[], labels: T[]) {
  return labels.map((label) => grades.filter((grade) => grade === label).length);
}

function getBarStyles(): { borderColor: string; backgroundColor: string } {
  const documentStyle = getComputedStyle(document.documentElement);
  return {
    borderColor: documentStyle.getPropertyValue("--p-primary-color"),
    backgroundColor: documentStyle.getPropertyValue("--p-highlight-focus-background"),
  };
}

function chartDataForOralPerformance(
  performance: Performance,
  performances: Performance[],
  students: EvaluatedStudent[],
) {
  const grades = filterForValidGrades(performance, performances, students);
  const labels = ["++", "+", "0", "-", "--", "f"];
  const histogram: number[] = computeHistogram(grades, labels);

  const average = histogram.reduce((acc, grade, index) => acc + grade * (index + 1), 0) / grades.length;

  const label = `Durchschnitt: ${labels[Math.floor(average) - 1]} - ${grades.length} bewertete Schüler`;

  const { borderColor, backgroundColor } = getBarStyles();

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

function chartDataForNonOralPerformance(
  performance: Performance,
  performances: Performance[],
  students: EvaluatedStudent[],
) {
  const grades = filterForValidGrades(performance, performances, students)
    .map(Number)
    .filter((grade) => !Number.isNaN(grade));

  const gradeLabels = Array.from({ length: 16 }, (_, i) => i);

  const gradePointsHistogram = computeHistogram(grades, gradeLabels);

  const gradePointsMappedToChartAdjustedGrades = grades.map((grade) => {
    if (grade >= 13) return 14;
    if (grade >= 10) return 11;
    if (grade >= 7) return 8;
    if (grade >= 4) return 5;
    if (grade >= 1) return 2;
    return null;
  });

  const gradeHistogram = computeHistogram(gradePointsMappedToChartAdjustedGrades, gradeLabels);

  const gradePointsMappedToGrades = grades.map((grade) => {
    if (grade >= 13) return 1;
    if (grade >= 10) return 2;
    if (grade >= 7) return 3;
    if (grade >= 4) return 4;
    if (grade >= 1) return 5;
    return 6;
  });

  const gradePointsAverage = grades.reduce((acc, grade) => acc + grade, 0) / grades.length;

  const gradeAverage =
    gradePointsMappedToGrades.reduce((acc, grade) => acc + grade, 0) / gradePointsMappedToGrades.length;

  const { borderColor, backgroundColor} = getBarStyles();

  return {
    labels: gradeLabels,
    datasets: [
      {
        label: ` Notenpunkte (15-0) - Durchschnitt: ${gradePointsAverage.toFixed(2)}`,
        data: gradePointsHistogram,
        backgroundColor: borderColor,
        borderColor: backgroundColor,
        borderWidth: 2,
        grouped: false,
      },
      {
        label: `Noten (1–6) - Durchschnitt: ${gradeAverage.toFixed(2)} - ${grades.length} bewertete Schüler`,
        data: gradeHistogram,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 2,
        barPercentage: 3.5,
        grouped: false,
      },
    ],
  };
}
