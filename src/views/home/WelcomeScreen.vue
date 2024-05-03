<script setup lang="ts">
import { PrimeIcons } from "primevue/api";
import PanelMenu from "primevue/panelmenu";
import { ref } from "vue";

const items = ref([
  { label: "Verwalten", icon: PrimeIcons.DATABASE, route: "/management" },
  { label: "Bewerten", icon: PrimeIcons.CHART_BAR, route: "/evaluation" },
  { label: "Konfigurieren", icon: PrimeIcons.COG, route: "/configuration" },
]);
</script>

<template>
  <div class="container">
    <div>
      <p class="text-xl font-semibold">Willkommen beim Notenwürfel!</p>
      <p class="text-lg font-semibold">Was haben Sie heute vor?</p>
    </div>
    <panel-menu
      :model="items"
      class="w-2"
    >
      <template #item="{ item, props }">
        <router-link
          v-if="item.route"
          v-slot="{ href, navigate }"
          :to="item.route"
          custom
        >
          <a
            v-ripple
            :href="href"
            v-bind="props.action"
            class="panel-item no-underline hover:surface-hover"
            @click="navigate"
          >
            <span
              :class="item.icon"
              class="font-bold text-color"
            />
            <span class="ml-2 font-bold text-color">{{ item.label }}</span>
            <span class="pi pi-arrow-right font-bold text-color" />
          </a>
        </router-link>
      </template>
    </panel-menu>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  place-items: center;
  height: 40vh;
}

.panel-item {
  display: grid;
  grid-template-columns: 30px 1fr 40px;
}
</style>
