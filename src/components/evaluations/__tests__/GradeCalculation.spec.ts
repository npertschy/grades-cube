import { describe, expect, it, vi } from "vitest";
import { useGradeCalculation } from "../GradeCalculation";
import type { Grade } from "../EvaluatedStudent";
import { PerformanceType, type Performance } from "../Performance";

const { computeOralSuggestion, computeWeightedOverall, computeATOverall, computeFinalOverall } = useGradeCalculation();

const defaultStudent = {
  id: 1,
  firstName: "John",
  lastName: "Doe",
  groups: [],
  courses: [],
};

function createGradesForType(
  performanceType: PerformanceType,
  values: string[],
  resultType: PerformanceType | undefined = undefined,
): Grade[] {
  const grades = values.map((value, index) => ({
    id: index + 1,
    value,
    performanceTitle: `Performance ${index + 1}`,
    performanceType,
  }));
  if (resultType) {
    grades.push({
      id: values.length + 1,
      value: "",
      performanceTitle: "Recommendation",
      performanceType: resultType,
    });
  }
  return grades;
}

function createPerformances(
  performanceType: PerformanceType,
  weights: number[],
  resultType: PerformanceType | undefined = undefined,
): Performance[] {
  const performances: Performance[] = [];
  weights.forEach((weight, index) => {
    performances.push({
      id: index + 1,
      performanceId: (index + 1).toString(),
      title: `Performance ${index + 1}`,
      editable: true,
      weight,
      sortOrder: index + 1,
      type: performanceType,
      courseId: 1,
      date: new Date(),
    });
  });

  if (resultType) {
    performances.push({
      id: weights.length + 1,
      performanceId: (weights.length + 1).toString(),
      title: "Recommendation",
      editable: false,
      weight: 1,
      sortOrder: weights.length + 1,
      type: resultType,
      courseId: 1,
      date: new Date(),
    });
  }

  return performances;
}

async function runOralSuggestion(
  gradeValues: string[],
  weights: number[],
): Promise<{ resultGrade: Grade | null; updateGrade: (grade: Grade) => Promise<void> }> {
  const student = {
    student: defaultStudent,
    grades: createGradesForType(PerformanceType.ORAL, gradeValues, PerformanceType.ORAL_SUGGESTION),
  };
  const performances = createPerformances(PerformanceType.ORAL, weights, PerformanceType.ORAL_SUGGESTION);
  let resultGrade: Grade | null = null;
  const updateGrade = vi.fn(async (grade: Grade) => {
    resultGrade = grade;
  });
  await computeOralSuggestion(student, performances, updateGrade);
  return { resultGrade, updateGrade };
}

async function runSpecialWeightedOverall(
  gradeValues: string[],
  weights: number[],
): Promise<{ resultGrade: Grade | null; updateGrade: (grade: Grade) => Promise<void> }> {
  const student = {
    student: defaultStudent,
    grades: createGradesForType(PerformanceType.SPECIAL, gradeValues, PerformanceType.SPECIAL_OVERALL),
  };
  const performances = createPerformances(PerformanceType.SPECIAL, weights, PerformanceType.SPECIAL_OVERALL);
  let resultGrade: Grade | null = null;
  const updateGrade = vi.fn(async (grade: Grade) => {
    resultGrade = grade;
  });
  await computeWeightedOverall(
    student,
    performances,
    PerformanceType.SPECIAL,
    PerformanceType.SPECIAL_OVERALL,
    updateGrade,
  );
  return { resultGrade, updateGrade };
}

async function runWrittenWeightedOverall(
  gradeValues: string[],
  weights: number[],
): Promise<{ resultGrade: Grade | null; updateGrade: (grade: Grade) => Promise<void> }> {
  const student = {
    student: defaultStudent,
    grades: createGradesForType(PerformanceType.WRITTEN, gradeValues, PerformanceType.WRITTEN_OVERALL),
  };
  const performances = createPerformances(PerformanceType.WRITTEN, weights, PerformanceType.WRITTEN_OVERALL);
  let resultGrade: Grade | null = null;
  const updateGrade = vi.fn(async (grade: Grade) => {
    resultGrade = grade;
  });
  await computeWeightedOverall(
    student,
    performances,
    PerformanceType.WRITTEN,
    PerformanceType.WRITTEN_OVERALL,
    updateGrade,
  );
  return { resultGrade, updateGrade };
}

async function runAtOverall(
  oralOverallGrade: string,
  oralOverallWeight: number,
  specialOverallGrade: string,
  specialOverallWeight: number,
): Promise<{ resultGrade: Grade | null; updateGrade: (grade: Grade) => Promise<void> }> {
  const student = {
    student: defaultStudent,
    grades: [
      ...createGradesForType(PerformanceType.ORAL_OVERALL, [oralOverallGrade]),
      ...createGradesForType(PerformanceType.SPECIAL_OVERALL, [specialOverallGrade], PerformanceType.AT_OVERALL),
    ],
  };
  const performances = [
    ...createPerformances(PerformanceType.ORAL_OVERALL, [oralOverallWeight]),
    ...createPerformances(PerformanceType.SPECIAL_OVERALL, [specialOverallWeight], PerformanceType.AT_OVERALL),
  ];
  let resultGrade: Grade | null = null;
  const updateGrade = vi.fn(async (grade: Grade) => {
    resultGrade = grade;
  });
  await computeATOverall(student, performances, updateGrade);
  return { resultGrade, updateGrade };
}

async function runOverall(
  atOverallGrade: string,
  atOverallWeight: number,
  writtenOverallGrade: string,
  writtenOverallWeight: number,
): Promise<{ resultGrade: Grade | null; updateGrade: (grade: Grade) => Promise<void> }> {
  const student = {
    student: defaultStudent,
    grades: [
      ...createGradesForType(PerformanceType.AT_OVERALL, [atOverallGrade]),
      ...createGradesForType(PerformanceType.WRITTEN_OVERALL, [writtenOverallGrade], PerformanceType.OVERALL),
    ],
  };
  const performances = [
    ...createPerformances(PerformanceType.AT_OVERALL, [atOverallWeight]),
    ...createPerformances(PerformanceType.WRITTEN_OVERALL, [writtenOverallWeight], PerformanceType.OVERALL),
  ];
  let resultGrade: Grade | null = null;
  const updateGrade = vi.fn(async (grade: Grade) => {
    resultGrade = grade;
  });
  await computeFinalOverall(student, performances, updateGrade);
  return { resultGrade, updateGrade };
}
describe("GradeCalculation", () => {
  describe("computeOralSuggestion", () => {
    it("should compute the '0' grade when all possible grades are present once", async () => {
      const { resultGrade, updateGrade } = await runOralSuggestion(["++", "+", "0", "-", "--"], [1, 1, 1, 1, 1]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("0");
    });

    it("should compute the '0' grade and ignore performance weights, instead use frequency", async () => {
      const { resultGrade, updateGrade } = await runOralSuggestion(["++", "+", "0", "-", "--"], [0, 0, 0, 0, 0]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("0");
    });

    it("should compute the '+' grade when all possible grades are '+'", async () => {
      const { resultGrade, updateGrade } = await runOralSuggestion(["+", "+", "+"], [1, 1, 1]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("+");
    });

    it("should compute the '+' grade when result goes to 0.4", async () => {
      const { resultGrade, updateGrade } = await runOralSuggestion(["+", "+", "0"], [1, 1, 1]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("+");
    });

    it("should round down on exact 0.5 average", async () => {
      // avg of "+", "0" = (1 + 2) / 2 = 1.5 → rounds to 1 → "+"
      const { resultGrade } = await runOralSuggestion(["+", "0"], [1, 1]);

      expect(resultGrade!.value).toBe("+");
    });

    it("should compute '--' when all grades are '--'", async () => {
      const { resultGrade, updateGrade } = await runOralSuggestion(["--", "--", "--"], [1, 1, 1]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("--");
    });

    it("should exclude 'f' grades from the average", async () => {
      // without "f": avg of "+", "0" = 1.5 → "+"
      // with "f" counted: avg of "+", "0", "f" = (1 + 2 + 5) / 3 = 2.67 → "-"
      const { resultGrade } = await runOralSuggestion(["+", "0", "f"], [1, 1, 1]);

      expect(resultGrade!.value).toBe("+");
    });

    it("should exclude empty grades from the average", async () => {
      // only "+" and "0" count; "" is ignored
      const { resultGrade } = await runOralSuggestion(["+", "0", ""], [1, 1, 1]);

      expect(resultGrade!.value).toBe("+");
    });

    it("should clear the recommendation when all grades are empty", async () => {
      const { resultGrade, updateGrade } = await runOralSuggestion(["", "", ""], [1, 1, 1]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("");
    });

    it("should clear the recommendation when all grades are 'f'", async () => {
      const { resultGrade, updateGrade } = await runOralSuggestion(["f", "f"], [1, 1]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("");
    });
  });

  describe("computeWeightedOverall - special", () => {
    it("should compute '7' for grades '6', '8' with equal weights", async () => {
      const { resultGrade, updateGrade } = await runSpecialWeightedOverall(["6", "8"], [0.5, 0.5]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("7");
    });

    it("should floor the result on a non-integer weighted average", async () => {
      // weighted avg = (6*1 + 8*2) / 3 = 22/3 = 7.33 → floor → 7
      const { resultGrade } = await runSpecialWeightedOverall(["6", "8"], [0.34, 0.66]);

      expect(resultGrade!.value).toBe("7");
    });

    it("should skew toward the higher-weight grade", async () => {
      // weighted avg = (4*1 + 10*3) / 4 = 34/4 = 8.5 → floor → 8
      const { resultGrade } = await runSpecialWeightedOverall(["4", "10"], [0.25, 0.75]);

      expect(resultGrade!.value).toBe("8");
    });

    it("should exclude empty grades from the weighted average", async () => {
      // only "8" counts; "" is ignored → result is "8"
      const { resultGrade } = await runSpecialWeightedOverall(["8", ""], [0.5, 0.5]);

      expect(resultGrade!.value).toBe("8");
    });

    it("should exclude 'f' grades from the weighted average", async () => {
      // only "6" counts; "f" is ignored → result is "6"
      const { resultGrade } = await runSpecialWeightedOverall(["6", "f"], [0.5, 0.5]);

      expect(resultGrade!.value).toBe("6");
    });

    it("should clear the overall when all grades are empty", async () => {
      const { resultGrade, updateGrade } = await runSpecialWeightedOverall(["", ""], [0.5, 0.5]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("");
    });
  });

  describe("computeWeightedOverall - written", () => {
    it("should compute '7' for grades '6', '8' with equal weights", async () => {
      const { resultGrade, updateGrade } = await runWrittenWeightedOverall(["6", "8"], [0.5, 0.5]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("7");
    });

    it("should floor the result on a non-integer weighted average", async () => {
      // weighted avg = (5*1 + 8*2) / 3 = 21/3 = 7 → floor → 7
      const { resultGrade } = await runWrittenWeightedOverall(["5", "8"], [0.34, 0.66]);

      expect(resultGrade!.value).toBe("6");
    });

    it("should skew toward the higher-weight grade", async () => {
      // weighted avg = (3*1 + 9*3) / 4 = 30/4 = 7.5 → floor → 7
      const { resultGrade } = await runWrittenWeightedOverall(["3", "9"], [0.25, 0.75]);

      expect(resultGrade!.value).toBe("7");
    });

    it("should exclude empty grades from the weighted average", async () => {
      const { resultGrade } = await runWrittenWeightedOverall(["10", ""], [0.5, 0.5]);

      expect(resultGrade!.value).toBe("10");
    });

    it("should clear the overall when all grades are empty", async () => {
      const { resultGrade, updateGrade } = await runWrittenWeightedOverall(["", ""], [0.5, 0.5]);

      expect(updateGrade).toHaveBeenCalledOnce();
      expect(resultGrade!.value).toBe("");
    });
  });

  describe("computeAtOverall", () => {
    it("should floor the result on a non-integer weighted average", async () => {
      const { resultGrade } = await runAtOverall("10", 0.7, "4", 0.3);

      expect(resultGrade!.value).toBe("8");
    });

    it("should return empty when oral overall is missing", async () => {
      const { resultGrade } = await runAtOverall("", 0.7, "4", 0.3);

      expect(resultGrade!.value).toBe("");
    });

    it("should return empty when special overall is missing", async () => {
      const { resultGrade } = await runAtOverall("6", 0.7, "", 0.3);

      expect(resultGrade!.value).toBe("");
    });
  });

  describe("computeFinalOverall", () => {
    it("should floor the result on a non-integer weighted average", async () => {
      const { resultGrade } = await runOverall("10", 0.7, "4", 0.3);

      expect(resultGrade!.value).toBe("8");
    });

    it("should return empty when oral overall is missing", async () => {
      const { resultGrade } = await runOverall("", 0.7, "4", 0.3);

      expect(resultGrade!.value).toBe("");
    });

    it("should return empty when special overall is missing", async () => {
      const { resultGrade } = await runOverall("6", 0.7, "", 0.3);

      expect(resultGrade!.value).toBe("");
    });
  });
});
