<template>
  <Menu :model="items" />
</template>

<script setup lang="ts">
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'

const items: MenuItem[] = [
  {
    label: 'Verwalten',
    icon: 'pi pi-database',
    to: '/management'
  },
  {
    label: 'Bewerten',
    icon: 'pi pi-list'
  },
  {
    label: 'Einstellungen',
    icon: 'pi pi-cog'
  }
]
</script>
