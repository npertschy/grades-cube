import { mount } from '@vue/test-utils'
import CourseTree from '@/sidebar/components/CourseTree.vue'
import Course from '@/model/Course'
import Subject from '@/model/Subject'

const courses = [
  new Course('9a', [new Subject(1, 'Deutsch')]),
  new Course('GK', [new Subject(2, 'Biologie'), new Subject(3, 'Chemie')])
]

describe('CourseTree', () => {
  it('should display button', () => {
    const wrapper = mount(CourseTree, { props: { courses } })

    expect(wrapper.get('[class=p-treenode-label]').text()).toContain('9a')
  })
})
