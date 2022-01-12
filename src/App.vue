<template>
  <div class="p-grid">
    <GroupOutline class="p-col-fixed" :groups="groups" :subjects="subjects" style="width: 250px"></GroupOutline>
  </div>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from 'vue'
import GroupOutline from './sidebar/components/GroupOutline.vue'
import axios from 'axios'
import Group from './model/Group'
import Subject from './model/Subject'

export default defineComponent({
  name: 'App',
  components: {
    GroupOutline,
  },
  setup() {
    let groups: Ref<Group[]> = ref([])
    let subjects: Ref<Subject[]> = ref([])

    axios.get('data/data.json').then((res) => {
      groups.value = res.data.groups
      subjects.value= res.data.subjects
    })


    return {
      groups,
      subjects,
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
