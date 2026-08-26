import { useConfirm, useToast } from "primevue";

export function useUiErrorHandling() {
  const toast = useToast();
  const confirm = useConfirm();

  async function runSafeWithToast(action: () => void | Promise<void>, message: string) {
    try {
      await action();
      displaySuccess(message);
    } catch (e) {
      displayError(e as Error);
    }
  }

  function displaySuccess(message: string) {
    toast.add({ severity: "success", summary: "Erfolg", detail: message, life: 5000 });
  }

  function displayError(e: Error) {
    toast.add({ severity: "error", summary: "Fehler", detail: e.message, life: 5000 });
  }

  function confirmAction(title: string, info: string, successMessage: string, action: () => void | Promise<void>) {
    confirm.require({
      header: title,
      message: info,
      icon: "pi pi-exclamation-triangle",
      rejectProps: { label: "Abbrechen", severity: "secondary", outlined: true },
      acceptProps: { label: "Löschen", severity: "danger" },
      accept: async () => {
        await runSafeWithToast(action, successMessage);
      },
    });
  }

  return {
    runSafeWithToast,
    confirmAction,
  };
}

async function runSafeWithThrow(action: () => void | Promise<void>, errorMessage: string) {
  try {
    await action();
  } catch (e) {
    throw new Error(errorMessage, { cause: e });
  }
}

export function useStoreErrorHandling() {
  return {
    runSafeWithThrow,
  };
}
