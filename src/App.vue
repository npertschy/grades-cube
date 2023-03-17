<template>
  <div class="main-grid app">
    <main-menu class="sidebar" />
    <group-outline
      class="col-fixed groupOutline"
      :groups="groups"
      :subjects="subjects"
      @group-selected="updatePupilTable"
    />
    <div class="col">
      <div class="grid">
        <pupil-table
          class="col px-3"
          :group="selectedGroupName"
          :subject="selectedSubject"
          :pupils="pupilsOfGroup"
          :grades-overview-visible="columnSelectionVisible"
        />
      </div>
      <Panel
        class="col"
        header="Notenspiegel"
        :collapsed="gradesOverviewCollapsed"
        :toggleable="true"
        @toggle="gradesOverviewCollapsed = !gradesOverviewCollapsed"
      >
        <grades-overview />
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
import MainMenu from '@/menu/MainMenu.vue'

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

.sidebar {
  grid-area: sidebar;
}

.router-view {
  grid-area: router-view;
  overflow-y: auto;
}

.groupOutline {
  grid-area: outline;
  width: 250px;
}

.main-grid {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: grid;
  /* grid-template-rows: min-content 1fr auto; */
  grid-template-columns: min-content min-content auto;
  grid-template-areas: 'sidebar outline router-view';
}
</style>
