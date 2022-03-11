<script setup lang="ts">
import { toRefs, computed } from 'vue'
import type Pupil from '../../model/Pupil'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { defaultColumns } from '../../composables/defaultColumns'

const props = defineProps<{
  group: string
  subject: string
  pupils: Pupil[]
}>()

const { group, subject, pupils } = toRefs(props)

const rows = computed(() =>
  pupils.value.map((student: Pupil, index) => {
    return {
      count: index + 1,
      name: student.name,
      oralSuggestion: '',
      oralOverall: '',
      specialOverall: '',
      generalPartOverall: '',
      writtenOverall: '',
      overall: ''
    }
  })
)

const { columns } = defaultColumns()

const course = computed(() => {
  return group.value + ' ' + subject.value
})
</script>

<template>
  <div class="flex-column">
    <div class="text-3xl flex font-bold">
      {{ course }}
    </div>
    <DataTable :value="rows" show-gridlines class="flex">
      <Column
        v-for="column in columns"
        :key="column.field"
        :field="column.field"
        :header="column.header"
        :style="column.style"
      ></Column>
    </DataTable>
  </div>
</template>
