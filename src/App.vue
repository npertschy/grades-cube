<template>
  <CourseTree :courses="courses" />
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Course from './model/Course'
import CourseTree from './sidebar/components/CourseTree.vue'
import Subject from './model/Subject'
export default defineComponent({
  name: 'App',
  components: {
    CourseTree
  },
  setup: () => {
    const courses = ref([new Course('9a', [new Subject(1, 'Deutsch'), new Subject(2, 'Englisch')])])

    return {
      courses
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
  color: #2c3e50;
  margin-top: 60px;
}
</style>
