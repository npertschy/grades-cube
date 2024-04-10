<script setup lang="ts">
import GlobalToolbar from "@/views/header/GlobalToolbar.vue";
import CustomTransition from "@/components/layout/CustomTransition.vue";
</script>

<template>
  <div>
    <GlobalToolbar />
    <main class="mt-2">
      <CustomTransition>
        <RouterView />
      </CustomTransition>
    </main>
  </div>
</template>
