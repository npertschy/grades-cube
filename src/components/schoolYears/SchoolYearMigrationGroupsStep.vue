<script setup lang="ts">
import type { MigrationGroupSelection } from "@/components/schoolYears/Migration";
import type { Student } from "@/components/students/Student";
import PAutoComplete, { type AutoCompleteCompleteEvent } from "primevue/autocomplete";
import PButton from "primevue/button";
import PCheckbox from "primevue/checkbox";
import PInputGroup from "primevue/inputgroup";
import PInputText from "primevue/inputtext";
import PPanel from "primevue/panel";
import { computed, ref } from "vue";

const props = defineProps<{
  groups: MigrationGroupSelection[];
  availableStudents: Student[];
}>();

const emit = defineEmits<{
  toggleGroup: [groupId: number | undefined];
  toggleStudent: [groupId: number | undefined, studentId: number | undefined];
  renameGroup: [groupId: number | undefined, name: string];
  addStudent: [groupId: number | undefined, student: Student];
}>();

const selectedStudents = ref<Record<number, Student | undefined>>({});
const studentQuery = ref("");

const filteredStudents = computed(() => {
  const query = studentQuery.value.toLocaleLowerCase();
  return props.availableStudents.filter((student) =>
    `${student.firstName ?? ""} ${student.lastName ?? ""}`.toLocaleLowerCase().includes(query),
  );
});

function addStudent(selection: MigrationGroupSelection): void {
  const groupId = selection.group.id;
  if (groupId === undefined) return;
  const student = selectedStudents.value[groupId];
  if (!student) return;
  emit("addStudent", groupId, student);
  selectedStudents.value[groupId] = undefined;
}

function formatStudent(student: Student): string {
  return `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();
}
</script>

<template>
  <div class="group-list">
    <p-panel
      v-for="selection in groups"
      :key="selection.group.id"
      toggleable
      :collapsed="!selection.selected"
    >
      <template #header>
        <div class="group-header">
          <p-checkbox
            :input-id="`migration-group-${selection.group.id}`"
            :model-value="selection.selected"
            binary
            @update:model-value="emit('toggleGroup', selection.group.id)"
          />
          <label :for="`migration-group-${selection.group.id}`">{{ selection.group.name }}</label>
        </div>
      </template>

      <div class="group-content">
        <template v-if="selection.selected">
          <label :for="`migration-name-${selection.group.id}`" class="font-semibold">Neuer Gruppenname</label>
          <p-input-text
            :id="`migration-name-${selection.group.id}`"
            :model-value="selection.newName"
            class="w-full"
            @update:model-value="emit('renameGroup', selection.group.id, String($event))"
          />
        </template>

        <div class="student-list">
          <div
            v-for="studentSelection in selection.students"
            :key="studentSelection.student.id"
            class="student-row"
          >
            <p-checkbox
              v-if="selection.selected"
              :input-id="`migration-student-${selection.group.id}-${studentSelection.student.id}`"
              :model-value="studentSelection.included"
              binary
              @update:model-value="emit('toggleStudent', selection.group.id, studentSelection.student.id)"
            />
            <label
              :for="selection.selected ? `migration-student-${selection.group.id}-${studentSelection.student.id}` : undefined"
            >
              {{ formatStudent(studentSelection.student) }}
            </label>
          </div>
          <p v-if="selection.students.length === 0" class="empty-hint">Keine Schüler in dieser Gruppe.</p>
        </div>

        <template v-if="selection.selected">
          <label :for="`migration-add-${selection.group.id}`" class="font-semibold">Schüler hinzufügen</label>
          <p-input-group>
            <p-auto-complete
              v-model="selectedStudents[selection.group.id!]"
              :input-id="`migration-add-${selection.group.id}`"
              :suggestions="filteredStudents"
              :option-label="formatStudent"
              force-selection
              class="w-full"
              @complete="(event: AutoCompleteCompleteEvent) => studentQuery = event.query"
            />
            <p-button
              label="Hinzufügen"
              icon="pi pi-plus"
              :disabled="!selectedStudents[selection.group.id!]"
              @click="addStudent(selection)"
            />
          </p-input-group>
        </template>
      </div>
    </p-panel>
  </div>
</template>

<style scoped>
.group-list,
.group-content,
.student-list {
  display: grid;
  gap: 0.75rem;
}

.group-header,
.student-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
