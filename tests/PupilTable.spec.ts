import { mount } from '@vue/test-utils'
import PupilTable from '@/table/components/PupilTable.vue'
import type Pupil from '@/model/Pupil'
import { describe, it, expect } from 'vitest'

const group = '8c'
const subject = 'Englisch'
const pupils: Pupil[] = [
  { id: 1, name: 'Tom' },
  { id: 2, name: 'Max' },
  { id: 3, name: 'Paul' }
]

describe('PupilTable', () => {
  it('should display all pupils and a header', () => {
    const wrapper = mount(PupilTable, {
      props: { group, subject, pupils }
    })

    expect(wrapper.findAll('tr')).toHaveLength(pupils.length + 1)
  })

  it('should display default columns', () => {
    const wrapper = mount(PupilTable, {
      props: { group, subject, pupils }
    })

    expect(wrapper.findAll('th')).toHaveLength(8)
  })
})
