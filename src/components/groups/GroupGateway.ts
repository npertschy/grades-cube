import type { Group } from "@/components/groups/Group";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import { db } from "@/store/Database";
import { Z_ENT } from "@/store/EntityId";
import type { QueryResult } from "@tauri-apps/plugin-sql";

export async function loadGroupsBySchoolYearAndSemester(schoolYear: SchoolYear): Promise<Group[]> {
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

export async function loadStudentsByGroup(group: Group) {
  const students: StudentEntity[] = await db.select(
    `
    SELECT * FROM ZSTUDENT
    INNER JOIN Z_3STUDENTS ON Z_PK = Z_3STUDENTS.Z_6STUDENTS1
    WHERE Z_3STUDENTS.Z_3GROUPS2 = $1
    `,
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

export async function createGroup(group: Group, schoolYear: SchoolYear) {
  const sortingName = group.name?.match(/^\d/) ? `0${group.name}` : group.name;
  const groupId: QueryResult = await db.execute(
    `
    INSERT INTO ZGROUP (Z_ENT, Z_OPT, ZNAME, ZTYPE, ZSORTINGNAME)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [Z_ENT.ZGROUP, 1, group.name, group.type, sortingName],
  );

  await db.execute(
    `
    INSERT INTO Z_3YEARS (Z_8YEARS, Z_3GROUPS1)
    VALUES ($1, $2)
    `,
    [schoolYear.id, groupId.lastInsertId],
  );
}

export async function deleteGroupInSchoolYear(group: Group, schoolYear: SchoolYear) {
  await db.execute(
    `
    DELETE FROM Z_3STUDENTS
    WHERE Z_3GROUPS2 = $1
    `,
    [group.id],
  );
  await db.execute(
    `
    DELETE FROM Z_3YEARS
    WHERE Z_3GROUPS1 = $1 
    AND Z_8YEARS = $2
    `,
    [group.id, schoolYear.id],
  );

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

  await db.execute(
    `
    DELETE FROM ZCOURSE
    WHERE ZGROUP = $1
    AND ZYEAR = $2
    `,
    [group.id, schoolYear.id],
  );

  await db.execute(
    `
    DELETE FROM ZGROUP
    WHERE Z_PK = $1
    `,
    [group.id],
  );
}

export async function updateGroup(group: Group) {
  const sortingName = group.name?.match(/^\d/) ? `0${group.name}` : group.name;
  await db.execute(
    `
    UPDATE ZGROUP
    SET ZNAME = $1, ZTYPE = $2, ZSORTINGNAME = $3, Z_OPT = Z_OPT + 1
    WHERE Z_PK = $4
    `,
    [group.name, group.type, sortingName, group.id],
  );
}

export async function assignStudentToGroup(student: Student, group: Group) {
  await db.execute(
    `
    INSERT INTO Z_3STUDENTS (Z_6STUDENTS1, Z_3GROUPS2)
    VALUES ($1, $2)
    `,
    [student.id, group.id],
  );
}

export async function unassignStudentFromGroup(student: Student, group: Group) {
  await db.execute(
    `
    DELETE FROM Z_3STUDENTS
    WHERE Z_6STUDENTS1 = $1
    AND Z_3GROUPS2 = $2
    `,
    [student.id, group.id],
  );
  // TODO: should we remove the student from the corresponding courses?
}
