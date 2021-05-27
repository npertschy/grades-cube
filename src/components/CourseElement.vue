<template>
  <ul class="root">
    <li @click="toggleClicked">
      <span class="caret">{{ course.name }}</span>
      <ul v-show="clicked">
        <li v-for="subject in course.subjects" :key="subject.id">
          {{ subject.name }}
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Course from '@/model/Course'

export default defineComponent({
  name: 'CourseElement',

  props: {
    course: Course
  },

  setup() {
    const clicked = ref(false)

    function toggleClicked() {
      clicked.value = !clicked.value
    }

    return {
      clicked,
      toggleClicked
    }
  }
})
</script>

<style scoped>
ul,
#root {
  list-style-type: none;
}

.root {
  margin: 0;
  padding: 0;
}

.caret {
  cursor: pointer;
  user-select: none;
}

.caret::before {
  content: '\25B6';
  color: black;
  display: inline-block;
  margin-right: 6px;
}
</style>
