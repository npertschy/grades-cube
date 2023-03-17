import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MainMenu from '@/menu/MainMenu.vue'
import PrimeVue from 'primevue/config'
import router from '@/router'
import { useRoute, useRouter } from 'vue-router'

describe('MainMenu', () => {
  const wrapper = mount(MainMenu, {
    global: {
      plugins: [PrimeVue, router]
    }
  })

  it('renders three menu elements', () => {
    expect(wrapper.html()).toContain('Verwalten')
    expect(wrapper.html()).toContain('Bewerten')
    expect(wrapper.html()).toContain('Einstellungen')
  })

  it('renders three icons for the menu elements', () => {
    expect(wrapper.html()).toContain('database')
    expect(wrapper.html()).toContain('list')
    expect(wrapper.html()).toContain('cog')
  })

  it('routes to management when clicked', async () => {
    const managementItem = wrapper.find('li[aria-label="Verwalten"]')
    const managementLink = managementItem.find('a')

    await managementLink.trigger('click')

    const router = useRouter()
    console.log(router)
    expect(router.currentRoute.value.name).toContain('management')
  })
})
