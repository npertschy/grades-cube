<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import DatePickerWithLabel from "@/components/layout/DatePickerWithLabel.vue";
import ContentEditingPanel from "@/components/layout/ContentEditingPanel.vue";
import PDivider from "primevue/divider";
import { computed, onMounted, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";
import { useRoute } from "vue-router";
import { useSchoolYearValidation } from "@/components/schoolYears/SchoolYearValidation";

const route = useRoute();

const firstStartDate = ref<Date>();
const firstEndDate = ref<Date>();
const secondStartDate = ref<Date>();
const secondEndDate = ref<Date>();

const { firstStartError, firstEndError, secondStartError, secondEndError, hasErrors } = useSchoolYearValidation({
  firstStartDate: firstStartDate,
  firstEndDate: firstEndDate,
  secondStartDate: secondStartDate,
  secondEndDate: secondEndDate,
});

const { schoolYears, loadAllSchoolYears, addSchoolYear, editSchoolYear, formatSchoolYear, removeSchoolYear } =
  useSchoolYears();
const toast = useToast();
const confirm = useConfirm();

onMounted(async () => {
  await loadAllSchoolYears();
});

const selectedSchoolYear = ref<SchoolYear | undefined>();
if (route.query["index"]) {
  selectedSchoolYear.value = schoolYears.value[+route.query["index"]];
}

async function handleSave() {
  try {
    if (selectedSchoolYear.value?.id) {
      const schoolYear: SchoolYear = {
        id: selectedSchoolYear.value.id,
        start: firstStartDate.value,
        end: secondEndDate.value,
        firstSemester: {
          id: selectedSchoolYear.value.firstSemester?.id,
          type: 1,
          start: firstStartDate.value,
          end: firstEndDate.value,
        },
        secondSemester: {
          id: selectedSchoolYear.value.secondSemester?.id,
          type: 2,
          start: secondStartDate.value,
          end: secondEndDate.value,
        },
      };

      await editSchoolYear(schoolYear, () => {
        resetDates();
        selectedSchoolYear.value = undefined;
      });
    } else {
      const schoolYear: SchoolYear = {
        id: undefined,
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

      await addSchoolYear(schoolYear, () => {
        resetDates();
        selectedSchoolYear.value = undefined;
      });
    }
  } catch (e) {
    toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
  }
}

watch(selectedSchoolYear, (current) => loadSchoolYear(current));

function resetDates() {
  firstStartDate.value = undefined;
  firstEndDate.value = undefined;
  secondStartDate.value = undefined;
  secondEndDate.value = undefined;
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
  if (!selectedSchoolYear.value) return;
  const schoolYear = selectedSchoolYear.value;
  confirm.require({
    message: `Soll "${formatSchoolYear(schoolYear)}" wirklich gelöscht werden? Alle zugehörigen Kurse, Leistungen und Noten werden ebenfalls gelöscht.`,
    header: "Schuljahr löschen",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Abbrechen", severity: "secondary", outlined: true },
    acceptProps: { label: "Löschen", severity: "danger" },
    accept: async () => {
      try {
        await removeSchoolYear(schoolYear);
        resetDates();
        selectedSchoolYear.value = undefined;
      } catch (e) {
        toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
      }
    },
  });
}

const disableSave = computed(() => {
  const result = !allDatesSet.value || hasErrors.value;
  if (selectedSchoolYear.value && selectedSchoolYear.value.id) {
    return result || disableSaveForExistingSchoolYear.value;
  }
  return result;
});

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
          <content-editing-panel header="Schuljahr">
            <div class="label-over-input">
              <date-picker-with-label
                v-model="firstStartDate"
                label="Start erstes Halbjahr"
                :validation-error-message="firstStartError"
              />
              <date-picker-with-label
                v-model="firstEndDate"
                label="Ende erstes Halbjahr"
                :validation-error-message="firstEndError"
              />
              <date-picker-with-label
                v-model="secondStartDate"
                label="Start zweites Halbjahr"
                :validation-error-message="secondStartError"
              />
              <date-picker-with-label
                v-model="secondEndDate"
                label="Ende zweites Halbjahr"
                :validation-error-message="secondEndError"
              />
            </div>
            <save-and-delete-buttons
              :show-delete-when-defined="selectedSchoolYear"
              :save-action="handleSave"
              :delete-action="handleRemove"
              :save-disabled="disableSave"
            />
          </content-editing-panel>
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
  row-gap: 1.5rem;
}

.calender-input {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
