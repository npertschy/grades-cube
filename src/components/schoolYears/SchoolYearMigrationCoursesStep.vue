<script setup lang="ts">
import { useCourses } from "@/components/courses/CourseStore";
import type { MigrationCoursePreview } from "@/components/schoolYears/Migration";
import PColumn from "primevue/column";
import PDataTable from "primevue/datatable";

defineProps<{ previews: MigrationCoursePreview[] }>();
const { formatCourse } = useCourses();
</script>

<template>
  <p-data-table
    :value="previews"
    sort-field="targetSemesterType"
    :sort-order="1"
    row-group-mode="subheader"
    group-rows-by="targetSemesterType"
  >
    <template #empty>Für die ausgewählten Gruppen sind keine Kurse vorhanden.</template>
    <p-column header="Kurs">
      <template #body="slotProps">{{ formatCourse(slotProps.data.course) }}</template>
    </p-column>
    <p-column field="newGroupName" header="Neue Gruppe" />
    <p-column header="Schüler">
      <template #body="slotProps">
        {{ slotProps.data.students.length }}
        <span v-if="slotProps.data.students.length">
          ({{ slotProps.data.students.map((student: any) => `${student.firstName} ${student.lastName}`).join(", ") }})
        </span>
      </template>
    </p-column>
  </p-data-table>
</template>
