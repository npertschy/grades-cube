import type { EvaluatedStudent, Grade } from "./EvaluatedStudent";
import { PerformanceType, type Performance } from "./Performance";

const possibleOralGrades = ["++", "+", "0", "-", "--", "f"];

async function computeOralSuggestion(
  student: EvaluatedStudent,
  performances: Performance[],
  updateGrade: (grade: Grade) => Promise<void>,
) {
  const oralGrades = student.grades
    .filter((g) => g.performanceType === PerformanceType.ORAL)
    .filter((g) => g.value !== undefined && g.value !== null && g.value !== "" && g.value !== "f");

  const recommendationIndex = performances.findIndex((p) => p.type === PerformanceType.ORAL_SUGGESTION);
  if (recommendationIndex < 0) return;
  const recommendationGrade = student.grades[recommendationIndex];
  if (!recommendationGrade) return;

  if (oralGrades.length === 0) {
    recommendationGrade.value = "";
    await updateGrade(recommendationGrade);
    return;
  }

  const sum = oralGrades.reduce((acc, g) => {
    return acc + possibleOralGrades.indexOf(g.value);
  }, 0);

  const avg = sum / oralGrades.length;
  const rounded = Math.round(avg - 0.001);
  recommendationGrade.value = possibleOralGrades[rounded] ?? "";
  await updateGrade(recommendationGrade);
}

function parseGradeValue(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "" || value === "f") {
    return null;
  }
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
}

async function computeWeightedOverall(
  student: EvaluatedStudent,
  performances: Performance[],
  inputType: PerformanceType,
  overallType: PerformanceType,
  updateGrade: (grade: Grade) => Promise<void>,
) {
  const overallIndex = performances.findIndex((p) => p.type === overallType);
  if (overallIndex < 0) return;
  const overallGrade = student.grades[overallIndex];
  if (!overallGrade) return;

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < performances.length; i++) {
    const perf = performances[i];
    if (perf.type !== inputType) continue;

    const gradeVal = parseGradeValue(student.grades[i]?.value);
    if (gradeVal === null) continue;

    weightedSum += gradeVal * perf.weight;
    totalWeight += perf.weight;
  }

  if (totalWeight === 0) {
    overallGrade.value = "";
  } else {
    overallGrade.value = Math.floor(weightedSum / totalWeight).toString();
  }
  await updateGrade(overallGrade);
}

async function computeATOverall(
  student: EvaluatedStudent,
  performances: Performance[],
  updateGrade: (grade: Grade) => Promise<void>,
) {
  const oralOverallIndex = performances.findIndex((p) => p.type === PerformanceType.ORAL_OVERALL);
  const specialOverallIndex = performances.findIndex((p) => p.type === PerformanceType.SPECIAL_OVERALL);
  const atOverallIndex = performances.findIndex((p) => p.type === PerformanceType.AT_OVERALL);
  if (atOverallIndex < 0) return;

  const atOverallGrade = student.grades[atOverallIndex];
  if (!atOverallGrade) return;

  const oralOverallGrade = parseGradeValue(student.grades[oralOverallIndex]?.value);
  const specialOverallGrade = parseGradeValue(student.grades[specialOverallIndex]?.value);

  if (oralOverallGrade === null || specialOverallGrade === null) {
    atOverallGrade.value = "";
  } else {
    const oralWeight = performances[oralOverallIndex].weight;
    const specialWeight = performances[specialOverallIndex].weight;
    atOverallGrade.value = Math.floor(oralOverallGrade * oralWeight + specialOverallGrade * specialWeight).toString();
  }
  await updateGrade(atOverallGrade);
}

async function computeFinalOverall(
  student: EvaluatedStudent,
  performances: Performance[],
  updateGrade: (grade: Grade) => Promise<void>,
) {
  const atOverallIndex = performances.findIndex((p) => p.type === PerformanceType.AT_OVERALL);
  const writtenOverallIndex = performances.findIndex((p) => p.type === PerformanceType.WRITTEN_OVERALL);
  const overallIndex = performances.findIndex((p) => p.type === PerformanceType.OVERALL);
  if (overallIndex < 0) return;

  const overallGrade = student.grades[overallIndex];
  if (!overallGrade) return;

  const atOverallGrade = parseGradeValue(student.grades[atOverallIndex]?.value);
  const writtenOverallGrade = parseGradeValue(student.grades[writtenOverallIndex]?.value);

  if (atOverallGrade === null || writtenOverallGrade === null) {
    overallGrade.value = "";
  } else {
    const atWeight = performances[atOverallIndex].weight;
    const writtenWeight = performances[writtenOverallIndex].weight;
    overallGrade.value = Math.floor(atOverallGrade * atWeight + writtenOverallGrade * writtenWeight).toString();
  }
  await updateGrade(overallGrade);
}

export function useGradeCalculation() {
  return {
    computeOralSuggestion,
    computeWeightedOverall,
    computeATOverall,
    computeFinalOverall,
  };
}
