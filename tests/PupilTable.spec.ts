import { DOMWrapper, mount, VueWrapper } from '@vue/test-utils'
import PupilTable from '@/table/components/PupilTable.vue'
import type Pupil from '@/model/Pupil'
import { describe, it, expect, beforeEach } from 'vitest'
import Tooltip from 'primevue/tooltip'
import OverlayPanel from 'primevue/overlaypanel/OverlayPanel.vue'
import PrimeVue from 'primevue/config'

const group = '8c'
const subject = 'Englisch'
const pupils: Pupil[] = [
  { id: 1, name: 'Tom' },
  { id: 2, name: 'Max' },
  { id: 3, name: 'Paul' }
]

describe('PupilTable', () => {
  describe('Testing table and columns', () => {
    let wrapper: VueWrapper

    beforeEach(() => {
      wrapper = setupComponent('', '', pupils, false)
    })

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
    it('displays radio buttons to be able to select columns', () => {
      const wrapper = setupComponent(group, '', pupils, true)

      expect(wrapper.findAll('input[type=radio]').length).toBeGreaterThan(1)
    })
  })

  describe('Add oral performance', () => {
    let wrapper: VueWrapper
    let button: DOMWrapper<HTMLButtonElement>

    beforeEach(() => {
      wrapper = setupComponent('', '', [], false)
      button = wrapper.find('button')
      expect(button.isVisible()).toBeTruthy()
    })

    it('renders a button with color lightcoral', () => {
      expect(button.attributes('style')).toContain('background-color: lightcoral;')
    })

    it('renders a label and an input when the button is clicked', async () => {
      // await button.trigger('click')

      const panel = wrapper.getComponent(OverlayPanel)

      // const label = panel.find('label')
      // expect(label.text()).toContain('Neue mündliche Leistung ')

      const input = panel.find('input[type=text]')
      expect(input.isVisible()).toBeTruthy()
    })
  })
})

function setupComponent(group: string, subject: string, pupils: Pupil[], gradesOverviewVisible: boolean) {
  return mount(PupilTable, {
    props: { group, subject, pupils, gradesOverviewVisible },
    global: {
      directives: {
        tooltip: Tooltip
      },
      plugins: [PrimeVue]
    }
  })
}
