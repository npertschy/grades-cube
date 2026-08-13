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
  try {
    await createGroup(group, schoolYear);
    await loadAllGroupsForSchoolYearAndSemester(schoolYear);
    cleanup();
  } catch (e) {
    throw new Error("Klasse konnte nicht gespeichert werden.", { cause: e });
  }
}

async function editGroup(group: Group, schoolYear: SchoolYear, cleanup: () => void) {
  try {
    await updateGroup(group);
    await loadAllGroupsForSchoolYearAndSemester(schoolYear);
    cleanup();
  } catch (e) {
    throw new Error("Klasse konnte nicht aktualisiert werden.", { cause: e });
  }
}

async function removeGroup(group: Group, schoolYear: SchoolYear, cleanup: () => void) {
  try {
    await deleteGroupInSchoolYear(group, schoolYear);
    await loadAllGroupsForSchoolYearAndSemester(schoolYear);
    cleanup();
  } catch (e) {
    throw new Error("Klasse konnte nicht gelöscht werden.", { cause: e });
  }
}

async function addStudentToGroup(student: Student, group: Group) {
  try {
    await assignStudentToGroup(student, group);
  } catch (e) {
    throw new Error("Schüler konnte nicht zur Klasse hinzugefügt werden.", { cause: e });
  }
}

async function removeStudentFromGroup(student: Student, group: Group) {
  try {
    await unassignStudentFromGroup(student, group);
  } catch (e) {
    throw new Error("Schüler konnte nicht aus der Klasse entfernt werden.", { cause: e });
  }
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
