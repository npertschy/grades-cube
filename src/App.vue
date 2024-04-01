<script setup lang="ts">
import Menubar from "primevue/menubar";
import Dropdown from "primevue/dropdown";
import Avatar from "primevue/avatar";
import { PrimeIcons } from "primevue/api";
import { ref } from "vue";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";

const items = ref([
  { label: "Verwalten", icon: PrimeIcons.DATABASE, route: "/management" },
  { label: "Bewerten", icon: PrimeIcons.CHART_BAR, route: "/evaluation" },
  { label: "Konfigurieren", icon: PrimeIcons.COG, route: "/configuration" },
]);

const { schoolYears } = useSchoolYears();
const selectedSchoolYear = ref<SchoolYear | undefined>();

function format(item: SchoolYear) {
  return item.id === 0
    ? "Neues Schuljahr anlegen"
    : "Schuljahr " +
        item.firstSemesterStart?.getFullYear() +
        "/" +
        item.secondSemesterEnd?.getFullYear();
}
</script>

<template>
  <div>
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
        <Dropdown v-model="selectedSchoolYear" :options="schoolYears">
          <template #option="slotProps">
            {{ format(slotProps.option) }}
          </template>
          <template #value="slotProps">
            <div v-if="slotProps.value">
              {{ format(slotProps.value) }}
            </div>
            <span v-else>Schuljahr auswählen</span>
          </template>
        </Dropdown>
        <Avatar icon="pi pi-user" shape="circle" class="ml-2" />
      </template>
    </Menubar>
    <main class="mt-2">
      <RouterView />
    </main>
  </div>
</template>
