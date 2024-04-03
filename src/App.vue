<script setup lang="ts">
import GlobalToolbar from "@/views/header/GlobalToolbar.vue";
</script>

<template>
  <div>
    <GlobalToolbar />
    <main class="mt-2">
      <RouterView />
    </main>
  </div>
</template>
