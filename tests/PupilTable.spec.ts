import { mount } from '@vue/test-utils'
import PupilTable from '@/table/components/PupilTable.vue'
import type Pupil from '@/model/Pupil'
import { describe, it, expect } from 'vitest'
import Tooltip from 'primevue/tooltip'

const group = '8c'
const subject = 'Englisch'
const pupils: Pupil[] = [
  { id: 1, name: 'Tom' },
  { id: 2, name: 'Max' },
  { id: 3, name: 'Paul' }
]

describe('PupilTable', () => {
  describe('Testing table and columns', () => {
    const wrapper = setupComponent('', '', pupils, false)

    it('displays all pupils and a header', () => {
      expect(wrapper.findAll('tr')).toHaveLength(pupils.length + 1)
    })

    it('displays default columns', () => {
      expect(wrapper.findAll('th')).toHaveLength(8)
    })
  })

  describe('Testing table title', () => {
    it('displays the name of the selected group', () => {
      const wrapper = setupComponent(group, '', pupils, false)

      expect(wrapper.html()).toContain('8c')
    })

    it('displays the full name of the selected course', () => {
      const wrapper = setupComponent(group, subject, pupils, false)

      expect(wrapper.html()).toContain('8c Englisch')
    })
  })

  describe('Column selection', () => {
    it('displays checkboxes to be able to select columns', () => {
      const wrapper = setupComponent(group, '', pupils, true)

      expect(wrapper.findAll('input[type=radio]').length).toBeGreaterThan(1)
    })
  })
})

function setupComponent(group: string, subject: string, pupils: Pupil[], gradesOverviewVisible: boolean) {
  return mount(PupilTable, {
    props: { group, subject, pupils, gradesOverviewVisible },
    global: {
      directives: {
        tooltip: Tooltip
      }
    }
  })
}
