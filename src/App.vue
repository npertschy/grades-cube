<script setup lang="ts">
import GlobalToolbar from "@/views/header/GlobalToolbar.vue";
import CustomTransition from "@/components/layout/CustomTransition.vue";
</script>

<template>
  <div>
    <GlobalToolbar />
    <main class="mt-2">
      <RouterView v-slot="{ Component }">
        <CustomTransition>
          <component :is="Component" />
        </CustomTransition>
      </RouterView>
    </main>
  </div>
</template>
