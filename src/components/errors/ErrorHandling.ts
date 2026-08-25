import { useConfirm, useToast } from "primevue";

export function useUiErrorHandling() {
  const toast = useToast();
  const confirm = useConfirm();

  async function runSafeWithToast(action: () => void | Promise<void>) {
    try {
      await action();
    } catch (e) {
      displayError(e as Error);
    }
  }

  function displayError(e: Error) {
    toast.add({ severity: "error", summary: "Fehler", detail: e.message, life: 5000 });
  }

  function confirmAction(header: string, message: string, action: () => void | Promise<void>) {
    confirm.require({
      header: header,
      message: message,
      icon: "pi pi-exclamation-triangle",
      rejectProps: { label: "Abbrechen", severity: "secondary", outlined: true },
      acceptProps: { label: "Löschen", severity: "danger" },
      accept: async () => {
        await runSafeWithToast(action);
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
