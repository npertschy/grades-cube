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
const gradesOverviewVisible = false

describe('PupilTable', () => {
  describe('Testing table and columns', () => {
    it('should display all pupils and a header', () => {
      const wrapper = mount(PupilTable, {
        props: { group: '', subject: '', pupils, gradesOverviewVisible }
      })

      expect(wrapper.findAll('tr')).toHaveLength(pupils.length + 1)
    })

    it('should display default columns', () => {
      const wrapper = mount(PupilTable, {
        props: { group: '', subject: '', pupils, gradesOverviewVisible }
      })

      expect(wrapper.findAll('th')).toHaveLength(8)
    })
  })

  describe('Testing table title', () => {
    it('should display the name of the selected group', () => {
      const wrapper = mount(PupilTable, {
        props: { group, subject: '', pupils, gradesOverviewVisible }
      })

      expect(wrapper.html()).toContain('8c')
    })

    it('should display the full name of the selected course', () => {
      const wrapper = mount(PupilTable, {
        props: { group, subject, pupils, gradesOverviewVisible }
      })

      expect(wrapper.html()).toContain('8c Englisch')
    })
  })

  describe('Column selection', () => {
    it('should display checkboxes to be able to select columns', () => {
      const wrapper = mount(PupilTable, {
        props: { group, subject: '', pupils, gradesOverviewVisible: true }
      })

      expect(wrapper.findAll('input[type=checkbox]').length).toBeGreaterThan(1)
    })
  })
})
