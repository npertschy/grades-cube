import type { Group } from "@/components/groups/Group";
import {
  assignStudentToGroup,
  createGroup,
  deleteGroupInSchoolYear,
  loadGroupsBySchoolYearAndSemester,
  loadStudentsByGroup,
  unassignStudentFromGroup,
  updateGroup,
} from "@/components/groups/GroupGateway";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";
import { ref } from "vue";
import { useStoreErrorHandling } from "../errors/ErrorHandling";

const { runSafeWithThrow } = useStoreErrorHandling();

const groups = ref<Group[]>([]);

async function loadAllGroupsForSchoolYearAndSemester(schoolYear: SchoolYear) {
  groups.value.length = 0;
  const all = await loadGroupsBySchoolYearAndSemester(schoolYear);
  groups.value.push(
    {
      id: 0,
      name: undefined,
      sortingName: undefined,
      students: undefined,
      type: undefined,
    },
    ...all,
  );
}

async function loadStudentsForGroup(group: Group): Promise<Student[]> {
  return await loadStudentsByGroup(group);
}

async function addGroup(group: Group, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await createGroup(group, schoolYear);
    await loadAllGroupsForSchoolYearAndSemester(schoolYear);
    cleanup();
  }, "Klasse konnte nicht gespeichert werden.");
}

async function editGroup(group: Group, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await updateGroup(group);
    await loadAllGroupsForSchoolYearAndSemester(schoolYear);
    cleanup();
  }, "Klasse konnte nicht aktualisiert werden.");
}

async function removeGroup(group: Group, schoolYear: SchoolYear, cleanup: () => void) {
  await runSafeWithThrow(async () => {
    await deleteGroupInSchoolYear(group, schoolYear);
    await loadAllGroupsForSchoolYearAndSemester(schoolYear);
    cleanup();
  }, "Klasse konnte nicht gelöscht werden.");
}

async function addStudentToGroup(student: Student, group: Group) {
  await runSafeWithThrow(async () => {
    await assignStudentToGroup(student, group);
  }, "Schüler konnte nicht zur Klasse hinzugefügt werden.");
}

async function removeStudentFromGroup(student: Student, group: Group) {
  await runSafeWithThrow(async () => {
    await unassignStudentFromGroup(student, group);
  }, "Schüler konnte nicht aus der Klasse entfernt werden.");
}

export function useGroups() {
  return {
    groups,
    loadAllGroupsForSchoolYearAndSemester,
    loadStudentsForGroup,
    addGroup,
    editGroup,
    removeGroup,
    addStudentToGroup,
    removeStudentFromGroup,
  };
}
