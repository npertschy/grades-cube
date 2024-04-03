<script setup lang="ts">
import SchoolYearSelector from "@/components/schoolYears/SchoolYearSelector.vue";
import Menubar from "primevue/menubar";
import Avatar from "primevue/avatar";
import { PrimeIcons } from "primevue/api";
import { ref } from "vue";

const items = ref([
  { label: "Verwalten", icon: PrimeIcons.DATABASE, route: "/management" },
  { label: "Bewerten", icon: PrimeIcons.CHART_BAR, route: "/evaluation" },
  { label: "Konfigurieren", icon: PrimeIcons.COG, route: "/configuration" },
]);
</script>

<template>
  <Menubar :model="items">
    <template #start>
      <span :class="PrimeIcons.BOX"></span>
      <span class="font-bold ml-2 mr-8">Notenwürfel</span>
    </template>
    <template #item="{ item, props }">
      <router-link
        v-if="item.route"
        v-slot="{ href, navigate }"
        :to="item.route"
        custom
      >
        <a v-ripple :href="href" v-bind="props.action" @click="navigate">
          <span :class="item.icon" />
          <span class="font-semibold ml-2">{{ item.label }}</span>
        </a>
      </router-link>
    </template>
    <template #end>
      <div class="grid gap-2 pt-2">
        <SchoolYearSelector />
        <Avatar icon="pi pi-user" shape="circle" class="mr-2" />
      </div>
    </template>
  </Menubar>
</template>
