import { computed, type Ref } from "vue";

interface UseSchoolYearValidationOptions {
  firstStartDate: Ref<Date | undefined>;
  firstEndDate: Ref<Date | undefined>;
  secondStartDate: Ref<Date | undefined>;
  secondEndDate: Ref<Date | undefined>;
}

function relatedDatesInvalid(date1: Date, date2: Date): boolean {
  if (date1.getFullYear() > date2.getFullYear()) {
    return true;
  }

  if (date1.getFullYear() === date2.getFullYear() && date1.getMonth() > date2.getMonth()) {
    return true;
  }

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() > date2.getDate()
  );
}

export function useSchoolYearValidation({
  firstStartDate,
  firstEndDate,
  secondStartDate,
  secondEndDate,
}: UseSchoolYearValidationOptions) {
  const firstStartError = computed(() => {
    if (firstStartDate.value && firstEndDate.value && relatedDatesInvalid(firstStartDate.value, firstEndDate.value)) {
      return "Das Startdatum des ersten Halbjahres muss vor dessen Enddatum liegen.";
    } else if (firstStartDate.value) {
      return undefined;
    } else {
      return "Geben Sie bitte ein Startdatum für das erste Halbjahr an.";
    }
  });

  const firstEndError = computed(() => {
    if (firstEndDate.value && secondStartDate.value && relatedDatesInvalid(firstEndDate.value, secondStartDate.value)) {
      return "Das Enddatum des ersten Halbjahres muss vor dem Startdatum des zweiten Halbjahres liegen.";
    } else if (
      firstStartDate.value &&
      firstEndDate.value &&
      relatedDatesInvalid(firstStartDate.value, firstEndDate.value)
    ) {
      return "Das Enddatum des ersten Halbjahres muss nach dessen Startdatum liegen.";
    } else if (firstEndDate.value) {
      return undefined;
    } else {
      return "Geben Sie bitte ein Enddatum für das erste Halbjahr an.";
    }
  });

  const secondStartError = computed(() => {
    if (firstEndDate.value && secondStartDate.value && relatedDatesInvalid(firstEndDate.value, secondStartDate.value)) {
      return "Das Startdatum des zweiten Halbjahres muss nach dem Enddatum des ersten Halbjahres liegen.";
    } else if (
      secondStartDate.value &&
      secondEndDate.value &&
      relatedDatesInvalid(secondStartDate.value, secondEndDate.value)
    ) {
      return "Das Startdatum des zweiten Halbjahres muss vor dessen Enddatum liegen.";
    } else if (secondStartDate.value) {
      return undefined;
    } else {
      return "Geben Sie bitte ein Startdatum für das zweite Halbjahr an.";
    }
  });

  const secondEndError = computed(() => {
    if (
      secondStartDate.value &&
      secondEndDate.value &&
      relatedDatesInvalid(secondStartDate.value, secondEndDate.value)
    ) {
      return "Das Enddatum des zweiten Halbjahres muss nach dessen Startdatum liegen.";
    } else if (secondEndDate.value) {
      return undefined;
    } else {
      return "Geben Sie bitte ein Enddatum für das zweite Halbjahr an.";
    }
  });

  const hasErrors = computed(() => {
    return (
      firstStartError.value !== undefined ||
      firstEndError.value !== undefined ||
      secondStartError.value !== undefined ||
      secondEndError.value !== undefined
    );
  });

  return {
    firstStartError,
    firstEndError,
    secondStartError,
    secondEndError,
    hasErrors,
  };
}
