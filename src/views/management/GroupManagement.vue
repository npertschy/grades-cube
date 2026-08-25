<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import InputWithLabel from "@/components/layout/InputWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import ContentEditingPanel from "@/components/layout/ContentEditingPanel.vue";
import SchoolYearSelectionContainer from "@/components/schoolYears/SchoolYearSelectionContainer.vue";
import AssignedStudentList from "@/components/layout/AssignedStudentList.vue";
import PRadioButton from "primevue/radiobutton";
import PDivider from "primevue/divider";
import { onMounted, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import type { Student } from "@/components/students/Student";
import type { Group } from "@/components/groups/Group";
import { useGroups } from "@/components/groups/GroupStore";
import { useSchoolYearSelection } from "@/components/schoolYears/SchoolYearSelection";

const {
  groups,
  loadAllGroupsForSchoolYearAndSemester,
  loadStudentsForGroup,
  addGroup,
  editGroup,
  removeGroup,
  addStudentToGroup,
  removeStudentFromGroup,
} = useGroups();
const name = ref<string>();
const groupType = ref<number>();

const toast = useToast();
const confirm = useConfirm();

const selectedGroup = ref<Group | undefined>();

const { selectedSchoolYear } = useSchoolYearSelection();

onMounted(async () => {
  if (selectedSchoolYear.value) {
    // NOTE: db has group <-> semesters but I think it is only valid for courses
    await loadAllGroupsForSchoolYearAndSemester(selectedSchoolYear.value);
  }
});

async function handleSave() {
  try {
    if (selectedGroup.value?.id) {
      const group = {
        id: selectedGroup.value.id,
        name: name.value,
        sortingName: selectedGroup.value.sortingName,
        type: groupType.value,
        students: [],
      };

      await editGroup(group, selectedSchoolYear.value!, () => {
        resetInputs();
        selectedGroup.value = undefined;
      });
    } else {
      const group = {
        id: undefined,
        name: name.value,
        sortingName: undefined,
        type: groupType.value,
        students: [],
      };

      await addGroup(group, selectedSchoolYear.value!, () => {
        resetInputs();
        selectedGroup.value = undefined;
      });
    }
  } catch (e) {
    toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
  }
}

watch(selectedGroup, (current) => loadGroup(current));

function resetInputs() {
  name.value = undefined;
}

async function loadGroup(item: Group | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    const students = await loadStudentsForGroup(item);
    name.value = item?.name;
    item.students = students;
    groupType.value = item?.type;
  }
}

function formatGroup(item: Group) {
  return item.id === 0 ? "Neue Klasse anlegen" : item.name!;
}

function handleRemove() {
  if (!selectedGroup.value) return;
  const group = selectedGroup.value;
  confirm.require({
    message: `Soll "${formatGroup(group)}" wirklich gelöscht werden?`,
    header: "Klasse löschen",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Abbrechen", severity: "secondary", outlined: true },
    acceptProps: { label: "Löschen", severity: "danger" },
    accept: async () => {
      try {
        await removeGroup(group, selectedSchoolYear.value!, () => {
          resetInputs();
          selectedGroup.value = undefined;
        });
      } catch (e) {
        toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
      }
    },
  });
}

async function handleAddingStudent() {
  if (student.value) {
    try {
      await addStudentToGroup(student.value, selectedGroup.value!);
      await loadGroup(selectedGroup.value);
    } catch (e) {
      toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
    }
  }
}

async function handleRemovingStudent() {
  if (selectedStudent.value) {
    try {
      await removeStudentFromGroup(selectedStudent.value, selectedGroup.value!);
      await loadGroup(selectedGroup.value);
    } catch (e) {
      toast.add({ severity: "error", summary: "Fehler", detail: (e as Error).message, life: 5000 });
    }
  }
}

watch(selectedSchoolYear, async (current) => {
  if (current) {
    await loadAllGroupsForSchoolYearAndSemester(current);
    selectedGroup.value = undefined;
    resetInputs();
  }
});
</script>

<template>
  <school-year-selection-container :selected-school-year="selectedSchoolYear">
    <management-panel header="Klassen verwalten">
      <template #list>
        <entity-list
          v-model="selectedGroup"
          :entities="groups"
          :format="formatGroup"
        />
      </template>
      <template #edit>
        <p>
          Verwalten Sie hier ihre Klassen. Sie können Klassen anlegen oder bearbeiten, indem Sie den entsprechenden
          Eintrag in der Liste auswählen.
        </p>
        <p-divider />
        <custom-transition>
          <div
            v-show="selectedGroup"
            class="edit-area"
          >
            <div class="group-area">
              <content-editing-panel header="Klasse">
                <input-with-label
                  v-model="name"
                  identifier="nameField"
                  label="Name"
                />
                <div
                  class="mt-2"
                  style="display: grid; grid-template-columns: repeat(2, 1fr)"
                >
                  <div>
                    <p-radio-button
                      v-model="groupType"
                      input-id="sek1"
                      name="sek"
                      :value="0"
                    />
                    <label
                      for="sek1"
                      class="font-semibold"
                    >
                      Sekundarstufe I
                    </label>
                  </div>
                  <div>
                    <p-radio-button
                      v-model="groupType"
                      input-id="sek2"
                      name="sek"
                      :value="1"
                    />
                    <label
                      for="sek2"
                      class="font-semibold"
                    >
                      Sekundarstufe II
                    </label>
                  </div>
                </div>
                <save-and-delete-buttons
                  :show-delete-when-defined="selectedGroup"
                  :save-action="handleSave"
                  :delete-action="handleRemove"
                  :grid-columns="3"
                />
              </content-editing-panel>
            </div>
            <div
              v-show="selectedGroup && selectedGroup.id && selectedGroup.id > 0"
              class="students-area"
            >
              <assigned-student-list
                :student-list="selectedGroup?.students ?? []"
                @add-student="handleAddingStudent"
                @remove-student="handleRemovingStudent"
              />
            </div>
          </div>
        </custom-transition>
      </template>
    </management-panel>
  </school-year-selection-container>
</template>

<style scoped>
.edit-area {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 1rem;
}

.group-area {
  grid-column: 1 / span 4;
}

.students-area {
  grid-column: 5 / span 8;
}
</style>
