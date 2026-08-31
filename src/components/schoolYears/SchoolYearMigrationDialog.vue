<script setup lang="ts">
import { useMigration } from "@/components/schoolYears/MigrationStore";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import SchoolYearMigrationCoursesStep from "@/components/schoolYears/SchoolYearMigrationCoursesStep.vue";
import SchoolYearMigrationGroupsStep from "@/components/schoolYears/SchoolYearMigrationGroupsStep.vue";
import { useToast } from "primevue";
import PButton from "primevue/button";
import PDialog from "primevue/dialog";
import PStep from "primevue/step";
import PStepList from "primevue/steplist";
import PStepPanel from "primevue/steppanel";
import PStepPanels from "primevue/steppanels";
import PStepper from "primevue/stepper";
import { computed, shallowRef, watch } from "vue";

const props = defineProps<{
  sourceYear: SchoolYear | undefined;
  targetYear: SchoolYear | undefined;
}>();
const emit = defineEmits<{ migrated: [] }>();
const visible = defineModel<boolean>("visible", { default: false });
const activeStep = shallowRef(1);
const toast = useToast();

const {
  groups,
  availableStudents,
  coursePreviews,
  startMigration,
  toggleGroupSelected,
  toggleStudentIncluded,
  renameGroup,
  addStudentToGroup,
  buildCoursePreviews,
  confirmMigration,
  cancelMigration,
} = useMigration();

const canContinue = computed(
  () => groups.value.some((selection) => selection.selected) &&
    groups.value.filter((selection) => selection.selected).every((selection) => selection.newName.trim().length > 0),
);

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible && props.sourceYear && props.targetYear) {
      activeStep.value = 1;
      await startMigration(props.sourceYear, props.targetYear);
    } else if (!isVisible) {
      cancelMigration();
    }
  },
  { immediate: true },
);

async function showCoursePreview(): Promise<void> {
  await buildCoursePreviews();
  activeStep.value = 2;
}

function close(): void {
  visible.value = false;
}

async function finishMigration(): Promise<void> {
  try {
    await confirmMigration();
    visible.value = false;
    emit("migrated");
    toast.add({ severity: "success", summary: "Erfolg", detail: "Schuljahr erfolgreich migriert", life: 5000 });
  } catch (error) {
    toast.add({ severity: "error", summary: "Fehler", detail: (error as Error).message, life: 5000 });
  }
}
</script>

<template>
  <p-dialog
    v-model:visible="visible"
    modal
    header="Schuljahr migrieren"
    :style="{ width: 'min(64rem, 95vw)' }"
  >
    <p-stepper v-model:value="activeStep" linear>
      <p-step-list>
        <p-step :value="1">Gruppen & Schüler</p-step>
        <p-step :value="2">Kurse</p-step>
      </p-step-list>
      <p-step-panels>
        <p-step-panel :value="1">
          <school-year-migration-groups-step
            :groups="groups"
            :available-students="availableStudents"
            @toggle-group="toggleGroupSelected"
            @toggle-student="toggleStudentIncluded"
            @rename-group="renameGroup"
            @add-student="addStudentToGroup"
          />
          <div class="dialog-actions">
            <p-button label="Weiter" icon="pi pi-arrow-right" icon-pos="right" :disabled="!canContinue" @click="showCoursePreview" />
          </div>
        </p-step-panel>
        <p-step-panel :value="2">
          <school-year-migration-courses-step :previews="coursePreviews" />
          <div class="dialog-actions">
            <p-button label="Zurück" severity="secondary" outlined @click="activeStep = 1" />
            <p-button label="Migration abschließen" icon="pi pi-check" @click="finishMigration" />
          </div>
        </p-step-panel>
      </p-step-panels>
    </p-stepper>

    <template #footer>
      <p-button label="Abbrechen" severity="secondary" text @click="close" />
    </template>
  </p-dialog>
</template>

<style scoped>
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>
