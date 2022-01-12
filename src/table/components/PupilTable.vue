<template>
  <DataTable :value="rows" show-gridlines>
    <Column 
    v-for="column in columns" 
    :key="column.field" 
    :field="column.field"
    :header="column.header"
    :style="column.style"></Column>
  </DataTable>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed } from 'vue'
import Pupil from '../../model/Pupil'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { defaultColumns } from '../../composables/defaultColumns'

export default defineComponent({
  name: 'PupilTable',
  components: { DataTable, Column },
  props: {
    pupils: {
      type: Array as PropType<Array<Pupil>>,
      required: true
    }
  },
  setup(props) {
    const { pupils } = toRefs(props)

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

    return {
      rows,
      columns
    }
  }
})
</script>
