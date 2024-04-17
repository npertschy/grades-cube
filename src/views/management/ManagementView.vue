<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import PMenu from "primevue/menu";
import { PrimeIcons } from "primevue/api";

const items = [
  {
    name: "Schuljahre",
    icon: PrimeIcons.CALENDAR,
    route: { name: "schoolYearManagement" },
  },
  {
    name: "Fächer",
    icon: PrimeIcons.INBOX,
    route: { name: "subjectManagement" },
  },
  {
    name: "Schüler",
    icon: PrimeIcons.USER,
    route: { name: "studentManagement" },
  },
  {
    name: "Klassen",
    icon: PrimeIcons.USERS,
    route: { name: "groupManagement" },
  },
  { name: "Kurse", icon: PrimeIcons.BOOK, route: { name: "courseManagement" } },
];
</script>

<template>
  <div class="container">
    <p-menu :model="items">
      <template #item="{ item, props }">
        <router-link
          v-if="item.route"
          v-slot="{ navigate, href }"
          :to="item.route"
          custom
        >
          <a
            v-ripple
            v-bind="props.action"
            :href="href"
            @click="navigate"
          >
            <span :class="item.icon" />
            <span class="font-semibold ml-2">{{ item.name }}</span>
          </a>
        </router-link>
      </template>
    </p-menu>
    <router-view v-slot="{ Component }">
      <custom-transition>
        <component :is="Component" />
      </custom-transition>
    </router-view>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 200px auto;
  column-gap: 0.5rem;
}
</style>
