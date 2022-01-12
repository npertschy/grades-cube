import { mount } from "@vue/test-utils"
import PupilTable from '@/table/components/PupilTable.vue'

const pupils = [
    { name: 'Tom'}, { name: 'Max'}, { name: 'Paul'}
]

describe('PupilTable', () => {
    it('should display all pupils and a header', () => {
        const wrapper = mount(PupilTable, {
            props: { pupils }
        })

        expect(wrapper.findAll('tr')).toHaveLength(pupils.length + 1)
    })

    it('should display default columns', () => {
        const wrapper = mount(PupilTable, {
            props: { pupils }
        })

        expect(wrapper.findAll('th')).toHaveLength(8)
    })
})
