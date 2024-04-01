import { ref } from "vue";
import type { Subject } from "./Subject";

const idCounter = ref(1);

const subjects = ref<Subject[]>([
  {
    id: 0,
    name: undefined,
  },
]);

function addSubject(subjectToAdd: Subject, cleanup: () => void) {
  if (subjectToAdd.id && subjectToAdd.id > 0) {
    const index = subjects.value.findIndex((it) => {
      return it.id == subjectToAdd.id;
    });

    subjects.value.splice(index, 1, subjectToAdd);
  } else {
    subjects.value.push({
      ...subjectToAdd,
      id: idCounter.value,
    });

    idCounter.value++;
  }

  cleanup();
}

function formatSubject(item: Subject) {
  return item.id === 0 ? "Neues Fach anlegen" : item.name;
}

function removeSubject(subject: Subject) {
  const index = subjects.value.findIndex((it) => {
    return it.id == subject.id;
  });

  subjects.value.splice(index, 1);
}

export function useSubjects() {
  return {
    subjects,
    addSubject,
    formatSubject,
    removeSubject,
  };
}
