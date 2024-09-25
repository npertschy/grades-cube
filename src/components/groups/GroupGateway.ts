import type { Group } from "@/components/groups/Group";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import { db } from "@/store/Database";
import type { QueryResult } from "@tauri-apps/plugin-sql";

export class GroupGateway {
  async loadGroupsForSchoolYearAndSemester(schoolYear: SchoolYear): Promise<Group[]> {
    const groups: GroupEntity[] = await db.select(
      `
      SELECT * FROM ZGROUP 
      INNER JOIN Z_3YEARS ON Z_PK = Z_3YEARS.Z_3GROUPS1 
      WHERE Z_3YEARS.Z_8YEARS = $1
      ORDER BY ZSORTINGNAME
`,
      [schoolYear.id],
    );

    return groups.map((group): Group => {
      return {
        id: group.Z_PK,
        name: group.ZNAME,
        sortingName: group.ZSORTINGNAME,
        type: group.ZTYPE,
        students: [],
      };
    });
  }

  async loadStudentsForGroup(group: Group) {
    const students: StudentEntity[] = await db.select(
      `SELECT * FROM ZSTUDENT 
      INNER JOIN Z_3STUDENTS ON Z_PK = Z_3STUDENTS.Z_6STUDENTS1 
      WHERE Z_3STUDENTS.Z_3GROUPS2 = $1`,
      [group.id],
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

  async createGroup(group: Group, schoolYear: SchoolYear) {
    const sortingName = group.name?.match(/^\d/) ? `0${group.name}` : group.name;
    const groupId: QueryResult = await db.execute(
      `INSERT INTO ZGROUP (Z_ENT, ZNAME, ZTYPE, ZSORTINGNAME) VALUES (3, $1, $2, $3)`,
      [group.name, group.type, sortingName],
    );

    await db.execute(`INSERT INTO Z_3YEARS (Z_8YEARS, Z_3GROUPS1) VALUES ($1, $2)`, [
      schoolYear.id,
      groupId.lastInsertId,
    ]);
  }

  async deleteGroupInSchoolYear(group: Group, schoolYear: SchoolYear) {
    await db.execute("DELETE FROM Z_3STUDENTS WHERE Z_3GROUPS2 = $1", [group.id]);
    await db.execute("DELETE FROM Z_3YEARS WHERE Z_3GROUPS1 = $1 AND Z_8YEARS = $2", [group.id, schoolYear.id]);

    await db.execute(
      `
      DELETE FROM ZGRADE
      INNER JOIN ZGRADE.ZPERFORMANCE ON ZPERFORMANCE.Z_PK
      INNER JOIN ZPERFORMANCE.ZCOURSE ON ZCOURSE.Z_PK
      WHERE ZCOURSE.ZGROUP = $1 
      AND ZCOURSE.ZYEAR = $2
      `,
      [group.id, schoolYear.id],
    );

    await db.execute(
      `
      DELETE FROM ZPERFORMANCE
      INNER JOIN ZPERFORMANCE.ZCOURSE ON ZCOURSE.Z_PK
      WHERE ZCOURSE.ZGROUP = $1 
      AND ZCOURSE.ZYEAR = $2
      `,
      [group.id, schoolYear.id],
    );

    await db.execute("DELETE FROM ZCOURSE WHERE ZGROUP = $1 AND ZYEAR = $2", [group.id, schoolYear.id]);

    await db.execute("DELETE FROM ZGROUP WHERE Z_PK = $1", [group.id]);
  }

  async updateGroup(group: Group) {
    const sortingName = group.name?.match(/^\d/) ? `0${group.name}` : group.name;
    await db.execute("UPDATE ZGROUP SET ZNAME = $1, ZTYPE = $2, ZSORTINGNAME = $3 WHERE Z_PK = $4", [
      group.name,
      group.type,
      sortingName,
      group.id,
    ]);
  }

  async addStudentToGroup(student: Student, group: Group) {
    await db.execute("INSERT INTO Z_3STUDENTS (Z_6STUDENTS1, Z_3GROUPS2) VALUES ($1, $2)", [student.id, group.id]);
  }

  async removeStudentFromGroup(student: Student, group: Group) {
    await db.execute("DELETE FROM Z_3STUDENTS WHERE Z_6STUDENTS1 = $1 AND Z_3GROUPS2 = $2", [student.id, group.id]);
    // TODO: should we remove the student from the corresponding courses?
  }
}
