<template>
  <CourseElement :course="course" />
</template>

<script lang="ts">
import Course from "@/model/Course";
import Subject from "@/model/Subject";
import { defineComponent, ref } from "vue";
import CourseElement from "./CourseElement.vue";

export default defineComponent({
  name: "CoursesOutline",
  components: { CourseElement },

  setup() {
    const clicked = ref(false);

    const course = ref(new Course("9a", [new Subject(1, "Deutsch"), new Subject(2, "Englisch")]));

    function rotate() {
      clicked.value = !clicked.value;
    }

    return {
      clicked,
      rotate,
      course,
    };
  },
});
</script>

<style>
ul, #root {
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
  content: "\25B6";
  color: black;
  display: inline-block;
  margin-right: 6px;
}

.caret-down::before {
  transform: rotate(90deg);
}

.nested {
  display: none;
}

.active {
  display: block;
}
</style>
