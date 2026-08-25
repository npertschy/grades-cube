import { beforeEach, describe, expect, it } from "vitest";
import { useSchoolYearValidation } from "../SchoolYearValidation";
import { ref } from "vue";

const firstStartDate = ref<Date | undefined>(undefined);
const firstEndDate = ref<Date | undefined>(undefined);
const secondStartDate = ref<Date | undefined>(undefined);
const secondEndDate = ref<Date | undefined>(undefined);

const { firstStartError, firstEndError, secondStartError, secondEndError } = useSchoolYearValidation({
  firstStartDate: firstStartDate,
  firstEndDate: firstEndDate,
  secondStartDate: secondStartDate,
  secondEndDate: secondEndDate,
});

describe("SchoolYearValidation", () => {
  beforeEach(() => {
    firstStartDate.value = undefined;
    firstEndDate.value = undefined;
    secondStartDate.value = undefined;
    secondEndDate.value = undefined;
  });

  it("should display validation errors for all fields when all dates are empty", () => {
    expect(firstStartError.value).toBe("Geben Sie bitte ein Startdatum für das erste Halbjahr an.");
    expect(firstEndError.value).toBe("Geben Sie bitte ein Enddatum für das erste Halbjahr an.");
    expect(secondStartError.value).toBe("Geben Sie bitte ein Startdatum für das zweite Halbjahr an.");
    expect(secondEndError.value).toBe("Geben Sie bitte ein Enddatum für das zweite Halbjahr an.");
  });

  it("should display first year validation error when first end is before first start", () => {
    firstStartDate.value = new Date(2024, 0, 10);
    firstEndDate.value = new Date(2024, 0, 5);

    expect(firstStartError.value).toBe("Das Startdatum des ersten Halbjahres muss vor dessen Enddatum liegen.");
    expect(firstEndError.value).toBe("Das Enddatum des ersten Halbjahres muss nach dessen Startdatum liegen.");
  });

  it("should display second year validation error when second start is before first end", () => {
    firstEndDate.value = new Date(2024, 0, 10);
    secondStartDate.value = new Date(2024, 0, 5);

    expect(secondStartError.value).toBe(
      "Das Startdatum des zweiten Halbjahres muss nach dem Enddatum des ersten Halbjahres liegen.",
    );
  });

  it("should display second year validation error when second end is before second start", () => {
    secondStartDate.value = new Date(2024, 0, 10);
    secondEndDate.value = new Date(2024, 0, 5);

    expect(secondEndError.value).toBe("Das Enddatum des zweiten Halbjahres muss nach dessen Startdatum liegen.");
  });
});
