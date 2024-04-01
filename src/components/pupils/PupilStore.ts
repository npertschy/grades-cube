import { ref } from "vue";
import type { Pupil } from "./Pupil";

const idCounter = ref(1);

const pupils = ref<Pupil[]>([
  {
    id: 0,
    firstName: undefined,
    lastName: undefined,
  },
]);

function addPupil(pupilToAdd: Pupil, cleanup: () => void) {
  if (pupilToAdd.id && pupilToAdd.id > 0) {
    const index = pupils.value.findIndex((it) => {
      return it.id == pupilToAdd.id;
    });

    pupils.value.splice(index, 1, pupilToAdd);
  } else {
    pupils.value?.push({
      ...pupilToAdd,
      id: idCounter.value,
    });

    idCounter.value++;
  }

  cleanup();
}

function format(item: Pupil) {
  return item.id === 0
    ? "Neuen Schüler anlegen"
    : item.firstName + " " + item.lastName;
}

function removePupil(pupil: Pupil) {
  const index = pupils.value.findIndex((it) => {
    return it.id == pupil.id;
  });

  pupils.value.splice(index, 1);
}

export function usePupils() {
  return {
    pupils,
    addPupil,
    format,
    removePupil,
  };
}
