<template>
  <Tree :value="nodes" selection-mode="single">
    <template #badge="slotProps">
      <b>{{ slotProps.node.label }}</b>
      <Badge :value="slotProps.node.data"></Badge>
    </template>
  </Tree>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue'
import Tree from 'primevue/tree'
import Badge from 'primevue/badge'
import CourseNode from '../model/CourseNode'
import Course from '../../model/Course'
import Subject from '../../model/Subject'
import SubjectNode from '../model/SubjectNode'
export default defineComponent({
  name: 'CourseTree',
  components: { Tree, Badge },
  props: {
    courses: {
      type: Array as PropType<Array<Course>>,
      default: () => []
    }
  },
  setup: (props) => {
    const { courses } = toRefs(props)

    const nodes: CourseNode[] = []
    courses.value.forEach((course: Course) => {
      const subjectNodes: SubjectNode[] = []
      course.subjects.forEach((subject: Subject) => {
        subjectNodes.push({
          key: subject.id,
          label: subject.name,
          data: subject.id,
          type: 'badge'
        })
      })
      nodes.push({
        key: course.name,
        label: course.name,
        data: 1,
        type: 'badge',
        children: subjectNodes
      })
    })
    return { nodes }
  }
})
</script>

<style scoped>
b {
  margin-right: 10px;
}
</style>
