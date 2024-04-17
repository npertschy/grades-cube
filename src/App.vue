<script setup lang="ts">
import GlobalToolbar from "@/views/header/GlobalToolbar.vue";
import CustomTransition from "@/components/layout/CustomTransition.vue";
</script>

<template>
  <div>
    <global-toolbar />
    <main class="mt-2">
      <router-view v-slot="{ Component }">
        <custom-transition>
          <component :is="Component" />
        </custom-transition>
      </router-view>
    </main>
  </div>
</template>
