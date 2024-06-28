import type { Group } from "@/components/groups/Group";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { GroupsToYears } from "@/components/groups/GroupsToYears";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import type { StudentEntity } from "@/components/students/StudentEntity";
import type { StudentsToGroups } from "@/components/students/StudentsToGroups";
import { db, orQuery } from "@/store/Database";

type GroupsToSemesters = {
  Z_3GROUPS: number;
  Z_5SEMESTERS: number;
};

export class GroupGateway {
  async loadGroupsForSchoolYearAndSemester(
    schoolYear: SchoolYear,
  ): Promise<Group[]> {
    const groupsBySchoolYear: GroupsToYears[] = await db.select(
      "SELECT Z_3GROUPS1 FROM Z_3YEARS WHERE Z_8YEARS = $1",
      [schoolYear.id],
    );
    const groupIdsBySchoolYear = groupsBySchoolYear.map((item) => {
      return item.Z_3GROUPS1;
    });

    const groupIdsOrQuery = orQuery(groupIdsBySchoolYear, "Z_PK", 1);

    const groups: GroupEntity[] = await db.select(
      "SELECT * FROM ZGROUP WHERE " + groupIdsOrQuery,
      groupIdsBySchoolYear,
    );

    return groups.map((group): Group => {
      return {
        id: group.Z_PK,
        name: group.ZNAME,
        students: [],
      };
    });
  }

  async loadStudentsForGroup(group: Group) {
    const studentsToGroup: StudentsToGroups[] = await db.select(
      "SELECT Z_6STUDENTS1 FROM Z_3STUDENTS WHERE Z_3GROUPS2 = $1",
      [group.id],
    );

    const studentIds = studentsToGroup.map((item) => {
      return item.Z_6STUDENTS1;
    });

    const studentIdsOrQuery = orQuery(studentIds, "Z_PK", 1);

    const students: StudentEntity[] = await db.select(
      "SELECT * FROM ZSTUDENT WHERE " + studentIdsOrQuery,
      studentIds,
    );

    return students.map((student) => {
      return {
        id: student.Z_PK,
        firstName: student.ZFIRSTNAME,
        lastName: student.ZLASTNAME,
        groups: [],
        courses: [],
      };
    });
  }
}
