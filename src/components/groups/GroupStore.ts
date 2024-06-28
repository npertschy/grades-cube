import type { Group } from "@/components/groups/Group";
import { GroupGateway } from "@/components/groups/GroupGateway";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";
import { ref } from "vue";

const groupGateway = new GroupGateway();

const groups = ref<Group[]>([]);

async function loadAllGroupsForSchoolYearAndSemester(schoolYear: SchoolYear) {
  groups.value.length = 0;
  const all = await groupGateway.loadGroupsForSchoolYearAndSemester(schoolYear);
  groups.value.push(
    {
      id: 0,
      name: undefined,
      students: undefined,
    },
    ...all,
  );
}

async function loadStudentsForGroup(group: Group): Promise<Student[]> {
  return await groupGateway.loadStudentsForGroup(group);
}

export function useGroups() {
  return {
    groups,
    loadAllGroupsForSchoolYearAndSemester,
    loadStudentsForGroup,
  };
}
