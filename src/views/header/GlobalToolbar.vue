<script setup lang="ts">
import SchoolYearSelector from "@/components/schoolYears/SchoolYearSelector.vue";
import PMenubar from "primevue/menubar";
import PAvatar from "primevue/avatar";
import PButton from "primevue/button";
import PPopover from "primevue/popover";
import PToggleSwitch from "primevue/toggleswitch";
import { PrimeIcons } from "@primevue/core/api";
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
  <p-menubar :model="items">
    <template #start>
      <p-button
        as="router-link"
        :to="{ name: 'home' }"
        text
        plain
        label="Notenwürfel"
        icon="pi pi-box"
        class="no-underline"
      />
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
          <span :class="item.icon" />
          <span class="ml-2">
            {{ item.label }}
          </span>
        </a>
      </router-link>
    </template>
    <template #end>
      <div class="header-end">
        <school-year-selector />
        <p-avatar
          icon="pi pi-user"
          shape="circle"
          class="mr-2 cursor-pointer"
          @click="toggle"
        />
        <p-popover ref="usermenu">
          <label for="theme-switch"> {{ themeSelection }} </label>
          <p-toggle-switch
            v-model="lightModeSelected"
            input-id="theme-switch"
          />
        </p-popover>
      </div>
    </template>
  </p-menubar>
</template>

<style scoped>
.header-end {
  display: grid;
  column-gap: 0.5rem;
  grid-template-columns: 1fr 1fr 30px;
  align-content: end;
}
</style>
