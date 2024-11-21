<script setup lang="ts">
import { PrimeIcons } from "@primevue/core/api";
import PPanelMenu from "primevue/panelmenu";
import { ref } from "vue";

const items = ref([
  { label: "Verwalten", icon: PrimeIcons.DATABASE, route: "/management" },
  { label: "Bewerten", icon: PrimeIcons.CHART_BAR, route: "/evaluation" },
  { label: "Konfigurieren", icon: PrimeIcons.COG, route: "/configuration" },
]);
</script>

<template>
  <div class="welcome-container with-height">
    <div class="welcome-container">
      <h1>Willkommen beim Notenwürfel!</h1>
      <h3>Was haben Sie heute vor?</h3>
    </div>
    <p-panel-menu
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
            class="panel-item no-underline"
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
    </p-panel-menu>
  </div>
</template>

<style scoped>
.welcome-container {
  display: grid;
  place-items: center;
}

.with-height {
  height: 40vh;
}

.panel-item {
  display: grid;
  grid-template-columns: 30px 1fr 40px;
}
</style>
