<template>
  <Tree :value="nodes" selection-mode="single">
    <template #badge="slotProps">
      <b>{{ slotProps.node.label }}</b>
      <Badge :value="slotProps.node.data"></Badge>
    </template>
  </Tree>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed } from 'vue'
import Tree, { TreeNode } from 'primevue/tree'
import Badge from 'primevue/badge'
import Course from '../../model/Course'
import Subject from '../../model/Subject'
import Group from '@/model/Group'
export default defineComponent({
  name: 'GroupOutline',
  components: { Tree, Badge },
  props: {
    groups: {
      type: Array as PropType<Array<Group>>,
      required: true
    },
    subjects: {
      type: Array as PropType<Array<Subject>>,
      required: true
    }
  },
  setup(props) {
    const { groups, subjects } = toRefs(props)

    const nodes = computed(() => groups.value.map((group: Group) => {
        const subjectNodes: TreeNode[] = group.courses.map((course: Course) => {
          const subject: Subject = subjects.value.filter((subject: Subject) => subject.id === course.subject)[0]
          return {
            key: subject.name,
            label: subject.name,
            data: subject.id,
            type: 'badge'
          } as TreeNode
        })
        return {
          key: group.name,
          label: group.name,
          data: 1,
          type: 'badge',
          children: subjectNodes
        } as TreeNode
      }))
    

    return {
      nodes
    }
  }
})
</script>

<style scoped>
b {
  margin-right: 10px;
}
</style>
