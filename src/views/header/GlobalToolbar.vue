<script setup lang="ts">
import SchoolYearSelector from "@/components/schoolYears/SchoolYearSelector.vue";
import Menubar from "primevue/menubar";
import Avatar from "primevue/avatar";
import PButton from "primevue/button";
import Popover from "primevue/popover";
import ToggleSwitch from "primevue/toggleswitch";
import { PrimeIcons } from "primevue/api";
import { ref, computed, watch } from "vue";

const items = ref([
  { label: "Verwalten", icon: PrimeIcons.DATABASE, route: "/management" },
  { label: "Bewerten", icon: PrimeIcons.CHART_BAR, route: "/evaluation" },
  { label: "Konfigurieren", icon: PrimeIcons.COG, route: "/configuration" },
]);

const usermenu = ref();

function toggle(event: Event) {
  usermenu.value.toggle(event);
}

const lightModeSelected = ref(false);

const themeSelection = computed(() => {
  return lightModeSelected.value ? "Dunkles Design" : "Helles Design";
});

watch(lightModeSelected, () => {
  document.body.classList.toggle("my-app-dark");
});
</script>

<template>
  <menubar :model="items">
    <template #start>
      <router-link to="/">
        <p-button
          text
          plain
          label="Notenwürfel"
          icon="pi pi-box"
        />
      </router-link>
    </template>
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
          :class="{
            'active-link': $route.path.includes(item.route),
          }"
          @click="navigate"
        >
          <span
            :class="[
              item.icon,
              $route.path.includes(item.route)
                ? 'font-bold-highlighted'
                : 'font-medium-normal',
            ]"
          />
          <span
            class="ml-2"
            :class="[
              $route.path.includes(item.route)
                ? 'font-bold-highlighted'
                : 'font-medium-normal',
            ]"
          >
            {{ item.label }}
          </span>
        </a>
      </router-link>
    </template>
    <template #end>
      <div class="header-end">
        <school-year-selector />
        <avatar
          icon="pi pi-user"
          shape="circle"
          class="mr-2 align-self-center cursor-pointer"
          @click="toggle"
        />
        <popover ref="usermenu">
          <label for="theme-switch"> {{ themeSelection }} </label>
          <toggle-switch
            v-model="lightModeSelected"
            input-id="theme-switch"
          />
        </popover>
      </div>
    </template>
  </menubar>
</template>

<style scoped>
.header-end {
  display: grid;
  column-gap: 0.5rem;
  grid-template-columns: 1fr 1fr 30px;
  align-content: end;
}
</style>
