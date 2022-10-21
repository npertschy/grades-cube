<template>
  <div class="grid app">
    <GroupOutline
      class="col-fixed groupOutline"
      :groups="groups"
      :subjects="subjects"
      @group-selected="updatePupilTable"
    >
    </GroupOutline>
    <div class="col">
      <div class="grid">
        <PupilTable
          class="col px-3"
          :group="selectedGroupName"
          :subject="selectedSubject"
          :pupils="pupilsOfGroup"
          :grades-overview-visible="columnSelectionVisible"
        ></PupilTable>
      </div>
      <Panel
        class="col"
        header="Notenspiegel"
        :collapsed="gradesOverviewCollapsed"
        :toggleable="true"
        @toggle="gradesOverviewCollapsed = !gradesOverviewCollapsed"
      >
        <GradesOverview />
      </Panel>
      </div>
    </div>
</template>

<script setup lang="ts">
import { type Ref, ref, computed } from 'vue'
import GroupOutline from './sidebar/components/GroupOutline.vue'
import PupilTable from './table/components/PupilTable.vue'
import type Pupil from './model/Pupil'
import { dataStore } from './composables/dataStore'
import type { TreeNode } from 'primevue/tree'
import Panel from 'primevue/panel'
import GradesOverview from './gradesOverview/components/GradesOverview.vue'

const { groups, subjects, pupils } = dataStore()
const pupilsOfGroup: Ref<Pupil[]> = ref([])
const selectedGroupName: Ref<string> = ref('')
const selectedSubject: Ref<string> = ref('')

const updatePupilTable = (selectedGroupNode: TreeNode) => {
  const selectedGroup = groups.value.filter((group) => group.id === selectedGroupNode.data)[0]
  selectedGroupName.value = selectedGroup.name
  selectedSubject.value = selectedGroupNode.leaf && selectedGroupNode.label ? selectedGroupNode.label : ''
  pupilsOfGroup.value = pupils.value.filter((pupil) => selectedGroup.pupils.includes(pupil.id))
}

const gradesOverviewCollapsed = ref(true)

const columnSelectionVisible = computed(() => {
  return !gradesOverviewCollapsed.value
})
</script>

<style>
.app {
  padding-top: 25px;
}

.groupOutline {
  width: 250px;
}
</style>
