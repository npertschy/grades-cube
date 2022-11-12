<template>
  <Tree :value="nodes" selection-mode="single" @node-select="emit('groupSelected', $event)">
    <template #badge="slotProps">
      <b>{{ slotProps.node.label }}</b>
      <Badge :value="slotProps.node.data"></Badge>
    </template>
  </Tree>
</template>

<script setup lang="ts">
import { toRefs, computed } from 'vue'
import Tree, { type TreeNode } from 'primevue/tree'
import Badge from 'primevue/badge'
import type Course from '../../model/Course'
import type Subject from '../../model/Subject'
import type Group from '@/model/Group'

interface Props {
  groups: Group[]
  subjects: Subject[]
}

interface Emits {
  (e: 'groupSelected', selectedGroupNode: TreeNode): void
}

const emit = defineEmits<Emits>()

const props = defineProps<Props>()
const { groups, subjects } = toRefs(props)

const nodes = computed(() =>
  groups.value.map((group: Group) => {
    const subjectNodes: TreeNode[] = group.courses.map((course: Course) => {
      const subject: Subject = subjects.value.filter((subject: Subject) => subject.id === course.subject)[0]
      return {
        key: group.id + '-' + subject.id,
        label: subject.name,
        data: group.id,
        type: 'badge',
        leaf: true
      } as TreeNode
    })
    return {
      key: group.id.toString(),
      label: group.name,
      data: group.id,
      type: 'badge',
      children: subjectNodes
    } as TreeNode
  })
)
</script>

<style scoped>
b {
  margin-right: 10px;
}
</style>
