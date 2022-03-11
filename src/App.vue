<script setup lang="ts">
import { type Ref, ref } from 'vue'
import GroupOutline from './sidebar/components/GroupOutline.vue'
import PupilTable from './table/components/PupilTable.vue'
import type Pupil from './model/Pupil'
import { dataStore } from './composables/dataStore'
import type { TreeNode } from 'primevue/tree'

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
</script>

<template>
  <div class="flex app">
    <GroupOutline
      class="flex-none groupOutline"
      :groups="groups"
      :subjects="subjects"
      @group-selected="updatePupilTable"
    >
    </GroupOutline>
    <PupilTable
      class="flex-grow-1 px-3"
      :group="selectedGroupName"
      :subject="selectedSubject"
      :pupils="pupilsOfGroup"
    ></PupilTable>
  </div>
</template>

<style>
.app {
  padding-top: 25px;
}

.groupOutline {
  width: 250px;
}
</style>
