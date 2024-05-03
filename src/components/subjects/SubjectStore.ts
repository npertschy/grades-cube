import { ref } from "vue";
import type { Subject } from "./Subject";
import { SubjectGateway } from "@/components/subjects/SubjectGateway";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";

const subjectGateway = new SubjectGateway();

const subjects = ref<Subject[]>([]);

async function loadSubjectsForSchoolYear(schoolYear: SchoolYear) {
  subjects.value.length = 0;

  const all = await subjectGateway.loadSubjectsForSchoolYear(schoolYear);
  subjects.value.push(
    {
      id: 0,
      name: undefined,
    },
    ...all,
  );
}

async function addSubject(subjectToAdd: Subject, schoolYear: SchoolYear, cleanup: () => void) {
  await subjectGateway.createSubjectForSchoolYear(subjectToAdd, schoolYear);
  await loadSubjectsForSchoolYear(schoolYear);

  cleanup();
}

async function editSubject(subject: Subject, schoolYear: SchoolYear, cleanup: () => void) {
  await subjectGateway.updateSubject(subject);
  await loadSubjectsForSchoolYear(schoolYear);

  cleanup();
}

function formatSubject(item: Subject) {
  return item.id === 0 ? "Neues Fach anlegen" : item.name!;
}

async function removeSubject(subject: Subject, schoolYear: SchoolYear, cleanup: () => void) {
  await subjectGateway.deleteSubjectFromSchoolYear(subject, schoolYear);
  await loadSubjectsForSchoolYear(schoolYear);

  cleanup();
}

export function useSubjects() {
  return {
    subjects,
    loadSubjectsForSchoolYear,
    addSubject,
    formatSubject,
    removeSubject,
    editSubject,
  };
}
