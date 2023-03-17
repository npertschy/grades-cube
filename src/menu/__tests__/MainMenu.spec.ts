import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MainMenu from '@/menu/MainMenu.vue'
import PrimeVue from 'primevue/config'
import router from '@/router'

describe('MainMenu', () => {
  describe('check menu labels and logos', () => {
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

    it('can click on link to navigate to management tab', async () => {
      const managementItem = wrapper.find('li[aria-label="Verwalten"]')
      const managementLink = managementItem.find('a')

      await managementLink.trigger('click')
    })

    it('can click on link to navigate to evaluate tab', async () => {
      const managementItem = wrapper.find('li[aria-label="Bewerten"]')
      const managementLink = managementItem.find('a')

      await managementLink.trigger('click')
    })

    it('can click on link to navigate to settings tab', async () => {
      const managementItem = wrapper.find('li[aria-label="Einstellungen"]')
      const managementLink = managementItem.find('a')

      await managementLink.trigger('click')
    })
  })
})
