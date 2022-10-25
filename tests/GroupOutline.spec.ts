import { mount } from '@vue/test-utils'
import GroupOutline from '@/sidebar/components/GroupOutline.vue'
import type Group from '@/model/Group'
import type Subject from '@/model/Subject'
import { test, it, expect } from 'vitest'

const groups: Group[] = [
  {
    id: 1,
    name: '9a',
    pupils: [1, 2, 3],
    courses: [
      {
        id: 1,
        subject: 2
      },
      {
        id: 2,
        subject: 1
      }
    ]
  }
]

const subjects: Subject[] = [
  {
    id: 1,
    name: 'Biologie'
  },
  {
    id: 2,
    name: 'Chemie'
  }
]

test('GroupOutline', () => {
  const wrapper = mount(GroupOutline, {
    props: { groups, subjects }
  })

  it('should display group names', () => {
    const treeNodeLabels = wrapper.html()
    expect(treeNodeLabels).toContain('9a')
  })

  it('should display subjects', async () => {
    const buttons = wrapper.findAll('button')

    buttons.forEach(async (button) => await button.trigger('click'))

    const subjectLabels = wrapper.html()

    expect(subjectLabels).toContain('Biologie')
    expect(subjectLabels).toContain('Chemie')
  })
})
