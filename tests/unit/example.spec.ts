import { shallowMount } from '@vue/test-utils'
import CoursesOutline from '@/components/CoursesOutline.vue'

describe('CourseOutline.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = shallowMount(CoursesOutline)
    expect(wrapper.text()).toMatch('9a')
  })
})
