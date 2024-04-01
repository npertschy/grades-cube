<script setup lang="ts">
import Menu from "primevue/menu";
import { PrimeIcons } from "primevue/api";

const items = [
  {
    name: "Schuljahre",
    icon: PrimeIcons.CALENDAR,
    route: { name: "schoolYearManagement" },
  },
  {
    name: "Schüler",
    icon: PrimeIcons.USER,
    route: { name: "pupilManagement" },
  },
  {
    name: "Klassen",
    icon: PrimeIcons.USERS,
    route: { name: "groupManagement" },
  },
  {
    name: "Fächer",
    icon: PrimeIcons.INBOX,
    route: { name: "subjectManagement" },
  },
  { name: "Kurse", icon: PrimeIcons.BOOK, route: { name: "courseManagement" } },
];
</script>

<template>
  <div class="grid grid-nogutter gap-2">
    <Menu :model="items" class="col-fixed" style="width: 200px">
      <template #item="{ item, props }">
        <router-link
          v-if="item.route"
          v-slot="{ navigate, href }"
          :to="item.route"
          custom
        >
          <a v-ripple v-bind="props.action" :href="href" @click="navigate">
            <span :class="item.icon" />
            <span class="font-semibold ml-2">{{ item.name }}</span>
          </a>
        </router-link>
      </template>
    </Menu>
    <RouterView class="col" />
  </div>
</template>
