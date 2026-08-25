import { ref } from "vue";
import type { Subject } from "./Subject";
import {
  createSubjectForSchoolYear,
  deleteSubjectFromSchoolYear,
  loadAll,
  loadSubjectsBySchoolYear,
  updateSubject,
} from "@/components/subjects/SubjectGateway";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import { useStoreErrorHandling } from "../errors/ErrorHandling";

const { runSafeWithThrow } = useStoreErrorHandling();

const subjects = ref<Subject[]>([]);

async function loadSubjectsForSchoolYear(schoolYear: SchoolYear) {
  subjects.value.length = 0;

  const all = await loadSubjectsBySchoolYear(schoolYear);
  subjects.value.push(
    {
      id: 0,
      name: undefined,
    },
    ...all,
  );
}

async function addSubject(subjectToAdd: Subject, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await createSubjectForSchoolYear(subjectToAdd, schoolYear);
    await loadSubjectsForSchoolYear(schoolYear);
    cleanup();
  }, "Fach konnte nicht gespeichert werden.");
}

async function editSubject(subject: Subject, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await updateSubject(subject);
    await loadSubjectsForSchoolYear(schoolYear);
    cleanup();
  }, "Fach konnte nicht aktualisiert werden.");
}

function formatSubject(item: Subject) {
  return item.id === 0 ? "Neues Fach anlegen" : item.name!;
}

async function removeSubject(subject: Subject, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await deleteSubjectFromSchoolYear(subject, schoolYear);
    await loadSubjectsForSchoolYear(schoolYear);
    cleanup();
  }, "Fach konnte nicht gelöscht werden.");
}

async function loadAllSubjects() {
  return await loadAll();
}

export function useSubjects() {
  return {
    subjects,
    loadSubjectsForSchoolYear,
    addSubject,
    formatSubject,
    removeSubject,
    editSubject,
    loadAllSubjects,
  };
}
