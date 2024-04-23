import { ref } from "vue";
import type { Subject } from "./Subject";
import { SubjectGateway } from "@/components/subjects/SubjectGateway";

const subjectGateway = new SubjectGateway();

const subjects = ref<Subject[]>([]);
await reloadAllSubjects();

async function reloadAllSubjects() {
  subjects.value.length = 0;
  const all = await subjectGateway.loadAllSubjects();
  subjects.value.push(
    {
      id: 0,
      name: undefined,
    },
    ...all,
  );
}

async function addSubject(subjectToAdd: Subject, cleanup: () => void) {
  await subjectGateway.createSubject(subjectToAdd);
  await reloadAllSubjects();

  cleanup();
}

async function editSubject(subject: Subject, cleanup: () => void) {
  await subjectGateway.updateSubject(subject);
  await reloadAllSubjects();

  cleanup();
}

function formatSubject(item: Subject) {
  return item.id === 0 ? "Neues Fach anlegen" : item.name!;
}

async function removeSubject(subject: Subject, cleanup: () => void) {
  await subjectGateway.deleteSubject(subject);
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
