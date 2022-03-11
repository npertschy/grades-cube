import type Group from '@/model/Group'
import type Pupil from '@/model/Pupil'
import type Subject from '@/model/Subject'
import data from '@/assets/data.json'
import { type Ref, ref } from 'vue'

export function dataStore() {
  const groups: Ref<Group[]> = ref([])
  const subjects: Ref<Subject[]> = ref([])
  const pupils: Ref<Pupil[]> = ref([])

  groups.value = data.groups
  subjects.value = data.subjects
  pupils.value = data.pupils

  return {
    groups,
    subjects,
    pupils
  }
}
