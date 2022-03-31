<template>
  <div class="flex-column">
    <div class="text-3xl flex font-bold">
      {{ course }}
    </div>
    <DataTable :value="rows" show-gridlines class="flex">
      <Column
        v-for="column in columns"
        :key="column.field"
        :header="column.header"
        :field="column.field"
        :style="column.style"
      >
        <template #header="slotProps">
          <Checkbox v-show="gradesOverviewVisible" v-model="checked" :value="slotProps.column" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { toRefs, computed, ref, type Ref } from 'vue'
import type Pupil from '../../model/Pupil'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Checkbox from 'primevue/checkbox'
import { defaultColumns } from '../../composables/defaultColumns'

const props = defineProps<{
  group: string
  subject: string
  pupils: Pupil[]
  gradesOverviewVisible: boolean
}>()

const { group, subject, pupils, gradesOverviewVisible } = toRefs(props)

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

const checked: Ref<Column[]> = ref([])
</script>
