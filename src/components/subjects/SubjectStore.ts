import { ref } from "vue";
import type { Subject } from "./Subject";
import { useSubjectGateway } from "@/components/subjects/SubjectGateway";

const { loadAllSubjects, createSubject, deleteSubject, updateSubject } =
  useSubjectGateway();

const subjects = ref<Subject[]>([]);
await reloadAllSubjects();

async function reloadAllSubjects() {
  const all = await loadAllSubjects();
  subjects.value = [
    {
      id: 0,
      name: undefined,
    },
    ...all,
  ];
}

async function addSubject(subjectToAdd: Subject, cleanup: () => void) {
  if (subjectToAdd.id && subjectToAdd.id > 0) {
    const index = subjects.value.findIndex((it) => {
      return it.id == subjectToAdd.id;
    });

    subjects.value.splice(index, 1, subjectToAdd);
  } else {
    await createSubject(subjectToAdd);
    await reloadAllSubjects();
  }

  cleanup();
}

async function editSubject(subject: Subject, cleanup: () => void) {
  await updateSubject(subject);
  await reloadAllSubjects();

  cleanup();
}

function formatSubject(item: Subject) {
  return item.id === 0 ? "Neues Fach anlegen" : item.name;
}

async function removeSubject(subject: Subject, cleanup: () => void) {
  await deleteSubject(subject);
  await reloadAllSubjects();

  cleanup();
}

export function useSubjects() {
  return {
    subjects,
    addSubject,
    formatSubject,
    removeSubject,
    editSubject,
  };
}
