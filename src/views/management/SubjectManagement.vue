<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import AutoCompleteWithLabel from "@/components/layout/AutoCompleteWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import SchoolYearSelectionContainer from "@/components/schoolYears/SchoolYearSelectionContainer.vue";
import ContentEditingPanel from "@/components/layout/ContentEditingPanel.vue";
import PDivider from "primevue/divider";
import { ref, watch, onMounted } from "vue";
import { useSubjects } from "@/components/subjects/SubjectStore";
import type { Subject } from "@/components/subjects/Subject";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";
import { useUiErrorHandling } from "@/components/errors/ErrorHandling";

const name = ref<string>();

const { subjects, loadSubjectsForSchoolYear, addSubject, formatSubject, removeSubject, editSubject, loadAllSubjects } =
  useSubjects();

const selectedSubject = ref<Subject | undefined>();

const { selectedSchoolYear } = useSchoolYearSelection();

const { runSafeWithToast, confirmAction } = useUiErrorHandling();

const allSubjects = ref<Subject[]>([]);

onMounted(async () => {
  allSubjects.value = await loadAllSubjects();
  if (selectedSchoolYear.value) {
    await loadSubjectsForSchoolYear(selectedSchoolYear.value);
  }
});

async function handleSave() {
  await runSafeWithToast(async () => {
    if (selectedSubject.value?.id) {
      const subject: Subject = {
        id: selectedSubject.value.id,
        name: name.value,
      };

      await editSubject(subject, selectedSchoolYear.value!, () => {
        resetInputs();
        selectedSubject.value = undefined;
      });
    } else {
      const subject: Subject = {
        id: undefined,
        name: name.value,
      };
      await addSubject(subject, selectedSchoolYear.value!, () => {
        resetInputs();
        selectedSubject.value = undefined;
      });
    }

    allSubjects.value = await loadAllSubjects();
  });
}

watch(selectedSubject, (current) => loadSubject(current));

function resetInputs() {
  name.value = undefined;
}

function loadSubject(item: Subject | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    name.value = item?.name;
  }
}

function handleRemove() {
  if (!selectedSubject.value) return;
  const subject = selectedSubject.value;
  confirmAction("Fach löschen", `Soll "${formatSubject(subject)}" wirklich gelöscht werden?`, async () => {
    await removeSubject(subject, selectedSchoolYear.value!, () => {
      selectedSubject.value = undefined;
      resetInputs();
    });
  });
}

watch(selectedSchoolYear, async (current) => {
  if (current) {
    await loadSubjectsForSchoolYear(current);
    selectedSubject.value = undefined;
    resetInputs();
  }
});
</script>

<template>
  <school-year-selection-container :selected-school-year="selectedSchoolYear">
    <management-panel header="Fächer verwalten">
      <template #list>
        <entity-list
          v-model="selectedSubject"
          :entities="subjects"
          :format="formatSubject"
        />
      </template>
      <template #edit>
        <p>
          Verwalten Sie hier ihre Fächer. Sie können Fächer anlegen oder bearbeiten, indem Sie den entsprechenden
          Eintrag in der Liste auswählen.
        </p>
        <p-divider />
        <custom-transition>
          <div v-show="selectedSubject">
            <content-editing-panel header="Fach">
              <auto-complete-with-label
                v-model="name"
                identifier="nameField"
                label="Name"
                :items="allSubjects"
                :option="formatSubject"
              />

              <save-and-delete-buttons
                :show-delete-when-defined="selectedSubject"
                :save-action="handleSave"
                :delete-action="handleRemove"
              />
            </content-editing-panel>
          </div>
        </custom-transition>
      </template>
    </management-panel>
  </school-year-selection-container>
</template>
