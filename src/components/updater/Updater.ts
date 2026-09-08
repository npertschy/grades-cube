import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { shallowRef } from "vue";

const availableUpdate = shallowRef<Update | null>(null);
const hasChecked = shallowRef(false);
const isInstalling = shallowRef(false);

async function checkForUpdates() {
  if (hasChecked.value) {
    return;
  }

  hasChecked.value = true;

  try {
    availableUpdate.value = await check();
    console.log(
      `found update ${availableUpdate.value?.version} from ${availableUpdate.value?.date} with notes ${availableUpdate.value?.body}`,
    );
  } finally {
    hasChecked.value = false;
  }
}

function isUpdateAvailable() {
    return availableUpdate.value !== null;
}

async function installUpdate() {
  if (!availableUpdate.value || isInstalling.value) {
    return;
  }

  isInstalling.value = true;

  try {
    let downloaded = 0;
    let contentLength = 0;
    // alternatively we could also call update.download() and update.install() separately
    await availableUpdate.value.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength ?? 0;
          console.log(`started downloading ${event.data.contentLength} bytes`);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          console.log(`downloaded ${downloaded} from ${contentLength}`);
          break;
        case "Finished":
          console.log("download finished");
          break;
      }
    });

    console.log("update installed");
    await relaunch();
  } catch (e) {
    throw new Error("Failed to install update", { cause: e });
  } finally {
    isInstalling.value = false;
  }
}

export function useUpdater() {
  return {
    checkForUpdates,
    isUpdateAvailable,
    installUpdate,
  };
}
