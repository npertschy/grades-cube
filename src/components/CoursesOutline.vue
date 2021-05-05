<template>
  <Tree :value="nodes" />
</template>

<script lang="ts">
import Course from "@/model/Course";
import Subject from "@/model/Subject";
import { defineComponent, ref } from "vue";
import Tree from "primevue/tree";

export default defineComponent({
  name: "CoursesOutline",
  components: { Tree },

  setup() {
    const clicked = ref(false);

    const course = ref(
      new Course("9a", [new Subject(1, "Deutsch"), new Subject(2, "Englisch")])
    );

    const nodes = [
        {
          "key": "9a",
          "label": "9a",
          "children": [
            {
              "key": 1,
              "label": "Deutsch",
            },
            {
              "key": 2,
              "label": "Englisch",
            },
          ],
        },
      ]

    function rotate() {
      clicked.value = !clicked.value;
    }

    return {
      clicked,
      rotate,
      course,
      nodes,
    };
  },
});
</script>

