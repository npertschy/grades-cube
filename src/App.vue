<script setup lang="ts">
import GlobalToolbar from "@/views/header/GlobalToolbar.vue";
import CustomTransition from "@/components/layout/CustomTransition.vue";
import PToast from "primevue/toast";
import PConfirmDialog from "primevue/confirmdialog";
import { onMounted } from "vue";
import { useUpdater } from "./components/updater/Updater";
import { useUiErrorHandling } from "./components/errors/ErrorHandling";

const { checkForUpdates, isUpdateAvailable, installUpdate } = useUpdater();
const { confirmAction, runSafeWithToast } = useUiErrorHandling();

onMounted(async () => {
  runSafeWithToast(async () => {
    await checkForUpdates();
  }, "Fehler beim Überprüfen auf Updates");
  if (isUpdateAvailable()) {
    confirmAction(
      "Neue Version verfügbar",
      "Es ist eine neue Version der Anwendung verfügbar. Möchten Sie jetzt aktualisieren?",
      "Update wird installiert...",
      async () => {
        await installUpdate();
      },
      "Aktualisieren",
    );
  }
});
</script>

<template>
  <div>
    <p-toast position="bottom-center" />
    <p-confirm-dialog />
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
