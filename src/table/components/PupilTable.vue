<template>
  <div class="grid">
    <div class="text-3xl col-11 font-bold">
      {{ course }}
    </div>
    <Button
      v-tooltip.bottom="'Neue mündliche Leistung'"
      icon="pi pi-plus"
      class="p-button-rounded col-1"
      style="background-color: lightcoral; border-color: lightcoral"
      @click="toggleAddOralPerformance"
    />
    <OverlayPanel id="add-oral" ref="showAddOral" :show-close-icon="true">
      <div class="field">
        <label for="new-oral-performance">Neue mündliche Leistung </label>
        <InputText id="new-oral-performance" />
      </div>
    </OverlayPanel>
    <DataTable :value="rows" show-gridlines class="col-12">
      <Column
        v-for="column in columns"
        :key="column.field"
        :header="column.header"
        :field="column.field"
        :style="column.style"
      >
        <template #header="slotProps">
          <RadioButton v-show="gradesOverviewVisible" v-model="checked" :value="slotProps.column" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { toRefs, computed, ref, type Ref } from 'vue'
import type Pupil from '@/model/Pupil'
import { defaultColumns } from '@/composables/defaultColumns'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import RadioButton from 'primevue/radiobutton'
import Button from 'primevue/button'
import OverlayPanel from 'primevue/overlaypanel'
import InputText from 'primevue/inputtext'

interface Props {
  group: string
  subject: string
  pupils: Pupil[]
  gradesOverviewVisible: boolean
}

const props = defineProps<Props>()

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

const checked: Ref<Column | null> = ref(null)

const showAddOral = ref(false)

const toggleAddOralPerformance = (_event: any): void => {
  showAddOral.value = !showAddOral.value
}
</script>
