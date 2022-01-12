<template>
  <div class="p-grid">
    <GroupOutline class="p-col-fixed" :groups="groups" :subjects="subjects" style="width: 250px"></GroupOutline>
    <PupilTable class="p-col" :pupils="pupils"></PupilTable>
  </div>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from 'vue'
import GroupOutline from './sidebar/components/GroupOutline.vue'
import PupilTable from './table/components/PupilTable.vue'
import axios from 'axios'
import Group from './model/Group'
import Subject from './model/Subject'
import Pupil from './model/Pupil'

export default defineComponent({
  name: 'App',
  components: {
    GroupOutline,
    PupilTable
  },
  setup() {
    let groups: Ref<Group[]> = ref([])
    let subjects: Ref<Subject[]> = ref([])
    let pupils: Ref<Pupil[]> = ref([])

    axios.get('data/data.json').then((res) => {
      groups.value = res.data.groups
      subjects.value= res.data.subjects
      pupils.value = res.data.pupils
    })


    return {
      groups,
      subjects,
      pupils
    }
  }
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 60px;
}
</style>
