<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import DatePickerWithLabel from "@/components/layout/DatePickerWithLabel.vue";
import PCard from "primevue/card";
import PDivider from "primevue/divider";
import { computed, ref, watch } from "vue";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";
import { useRoute } from "vue-router";

const route = useRoute();

const firstStartDate = ref<Date>();
const firstEndDate = ref<Date>();
const secondStartDate = ref<Date>();
const secondEndDate = ref<Date>();

const firstStartDateValidationErrorMessage = ref<string | undefined>(
  "Geben Sie bitte ein Startdatum für das erste Halbjahr an.",
);
const firstEndDateValidationErrorMessage = ref<string | undefined>(
  "Geben Sie bitte ein Enddatum für das erste Halbjahr an.",
);
const secondStartDateValidationErrorMessage = ref<string | undefined>(
  "Geben Sie bitte ein Startdatum für das zweite Halbjahr an.",
);
const secondEndDateValidationErrorMessage = ref<string | undefined>(
  "Geben Sie bitte ein Enddatum für das zweite Halbjahr an.",
);

const { schoolYears, addSchoolYear, formatSchoolYear, removeSchoolYear } = useSchoolYears();

const selectedSchoolYear = ref<SchoolYear | undefined>();
if (route.query["index"]) {
  selectedSchoolYear.value = schoolYears.value[+route.query["index"]];
}

function handleSave() {
  const id = selectedSchoolYear.value ? selectedSchoolYear.value.id : undefined;
  const schoolYear: SchoolYear = {
    id: id,
    start: firstStartDate.value,
    end: secondEndDate.value,
    firstSemester: {
      id: undefined,
      type: 1,
      start: firstStartDate.value,
      end: firstEndDate.value,
    },
    secondSemester: {
      id: undefined,
      type: 2,
      start: secondStartDate.value,
      end: secondEndDate.value,
    },
  };

  addSchoolYear(schoolYear, () => {
    resetDates();
    selectedSchoolYear.value = undefined;
  });
}

watch(selectedSchoolYear, (current) => loadSchoolYear(current));

function resetDates() {
  firstStartDate.value = undefined;
  firstEndDate.value = undefined;
  secondStartDate.value = undefined;
  secondEndDate.value = undefined;

  firstStartDateValidationErrorMessage.value = "Geben Sie bitte ein Startdatum für das erste Halbjahr an.";
  firstEndDateValidationErrorMessage.value = "Geben Sie bitte ein Enddatum für das erste Halbjahr an.";
  secondStartDateValidationErrorMessage.value = "Geben Sie bitte ein Startdatum für das zweite Halbjahr an.";
  secondEndDateValidationErrorMessage.value = "Geben Sie bitte ein Enddatum für das zweite Halbjahr an.";
}

function loadSchoolYear(item: SchoolYear | undefined) {
  resetDates();
  if (item?.id && item.id > 0) {
    firstStartDate.value = item?.firstSemester?.start;
    firstEndDate.value = item?.firstSemester?.end;
    secondStartDate.value = item?.secondSemester?.start;
    secondEndDate.value = item?.secondSemester?.end;
  }
}

function handleRemove() {
  if (selectedSchoolYear.value) {
    removeSchoolYear(selectedSchoolYear.value);
  }
}

const disableSave = computed(() => {
  const result =
    !allDatesSet.value ||
    firstStartDateValidationErrorMessage.value != undefined ||
    firstEndDateValidationErrorMessage.value != undefined ||
    secondStartDateValidationErrorMessage.value != undefined ||
    secondEndDateValidationErrorMessage.value != undefined;
  if (selectedSchoolYear.value && selectedSchoolYear.value.id) {
    return result || disableSaveForExistingSchoolYear.value;
  }
  return result;
});

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

const disableSaveForExistingSchoolYear = computed(() => {
  return (
    selectedSchoolYear.value?.firstSemester?.start?.getDate() === firstStartDate.value?.getDate() &&
    selectedSchoolYear.value?.firstSemester?.end?.getDate() === firstEndDate.value?.getDate() &&
    selectedSchoolYear.value?.secondSemester?.start?.getDate() === secondStartDate.value?.getDate() &&
    selectedSchoolYear.value?.secondSemester?.end?.getDate() === secondEndDate.value?.getDate()
  );
});

const allDatesSet = computed(() => {
  return (
    firstStartDate.value != undefined &&
    firstEndDate.value != undefined &&
    secondStartDate.value != undefined &&
    secondEndDate.value != undefined
  );
});

watch([firstStartDate, firstEndDate], ([newFirstStartDate, newFirstEndDate]) => {
  if (!newFirstStartDate) {
    firstStartDateValidationErrorMessage.value = "Geben Sie bitte ein Startdatum für das erste Halbjahr an.";
  } else if (newFirstEndDate && relatedDatesInvalid(newFirstStartDate, newFirstEndDate)) {
    firstStartDateValidationErrorMessage.value = "Das Startdatum des ersten Halbjahres muss vor dem Enddatum liegen.";
  } else {
    firstStartDateValidationErrorMessage.value = undefined;
  }
});

watch([firstEndDate, firstEndDate, secondStartDate], ([newFirstEndDate, newFirstStartDate, newSecondStartDate]) => {
  if (!newFirstEndDate) {
    firstEndDateValidationErrorMessage.value = "Geben Sie bitte ein Enddatum für das erste Halbjahr an.";
  } else if (newSecondStartDate && relatedDatesInvalid(newFirstEndDate, newSecondStartDate)) {
    firstEndDateValidationErrorMessage.value =
      "Das Enddatum des ersten Halbjahres muss vor dem Startdatum des zweiten Halbjahres liegen.";
  } else if (newFirstStartDate && relatedDatesInvalid(newFirstStartDate, newFirstEndDate)) {
    firstEndDateValidationErrorMessage.value = "Das Enddatum des ersten Halbjahres muss nach dem Startdatum liegen.";
  } else {
    firstEndDateValidationErrorMessage.value = undefined;
  }
});

watch([secondStartDate, firstEndDate, secondEndDate], ([newSecondStartDate, newFirstEndDate, newSecondEndDate]) => {
  if (!newSecondStartDate) {
    secondStartDateValidationErrorMessage.value = "Geben Sie bitte ein Startdatum für das zweite Halbjahr an.";
  } else if (newSecondEndDate && relatedDatesInvalid(newSecondStartDate, newSecondEndDate)) {
    secondStartDateValidationErrorMessage.value = "Das Enddatum des zweiten Halbjahres muss vor dem Startdatum liegen.";
  } else if (newFirstEndDate && relatedDatesInvalid(newFirstEndDate, newSecondStartDate)) {
    secondStartDateValidationErrorMessage.value =
      "Das Startdatum des zweiten Halbjahres muss nach dem Enddatum des ersten Halbjahres liegen.";
  } else {
    secondStartDateValidationErrorMessage.value = undefined;
  }
});

watch([secondEndDate, secondStartDate], ([newSecondEndDate, newSecondStartDate]) => {
  if (!newSecondEndDate) {
    secondEndDateValidationErrorMessage.value = "Geben Sie bitte ein Enddatum für das zweite Halbjahr an.";
  } else if (newSecondStartDate && relatedDatesInvalid(newSecondStartDate, newSecondEndDate)) {
    secondEndDateValidationErrorMessage.value = "Das Enddatum des zweiten Halbjahres muss vor dem Startdatum liegen.";
  } else {
    secondEndDateValidationErrorMessage.value = undefined;
  }
});
</script>

<template>
  <management-panel header="Schuljahre verwalten">
    <template #list>
      <div>
        <entity-list
          v-model="selectedSchoolYear"
          :entities="schoolYears"
          :format="formatSchoolYear"
        />
      </div>
    </template>
    <template #edit>
      <p>
        Verwalten Sie hier ihre Schuljahre. Sie können Schuljahre anlegen oder bearbeiten, indem Sie den entsprechenden
        Eintrag in der Liste auswählen.
      </p>
      <p-divider />
      <custom-transition>
        <div v-show="selectedSchoolYear">
          <p-card class="shadow-2">
            <template #title>Erstes Halbjahr</template>
            <template #content>
              <div class="label-over-input">
                <date-picker-with-label
                  v-model="firstStartDate"
                  label="Start erstes Halbjahr"
                  :validation-error-message="firstStartDateValidationErrorMessage"
                />
                <date-picker-with-label
                  v-model="firstEndDate"
                  label="Ende erstes Halbjahr"
                  :validation-error-message="firstEndDateValidationErrorMessage"
                />
              </div>
            </template>
          </p-card>
          <p-card class="shadow-2 mt-2">
            <template #title>Zweites Halbjahr</template>
            <template #content>
              <div class="label-over-input">
                <date-picker-with-label
                  v-model="secondStartDate"
                  label="Start zweites Halbjahr"
                  :validation-error-message="secondStartDateValidationErrorMessage"
                />
                <date-picker-with-label
                  v-model="secondEndDate"
                  label="Ende zweites Halbjahr"
                  :validation-error-message="secondEndDateValidationErrorMessage"
                />
              </div>
            </template>
          </p-card>
          <save-and-delete-buttons
            :show-delete-when-defined="selectedSchoolYear"
            :save-action="handleSave"
            :delete-action="handleRemove"
            :save-disabled="disableSave"
          />
        </div>
      </custom-transition>
    </template>
  </management-panel>
</template>

<style scoped>
.label-over-input {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 0.5rem;
}

.calender-input {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
