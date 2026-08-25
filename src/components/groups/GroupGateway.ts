import type { Group } from "@/components/groups/Group";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import { db, nextPrimaryKey, withTransaction, type CountResult } from "@/store/Database";
import { Z_ENT } from "@/store/EntityId";

export async function loadGroupsBySchoolYearAndSemester(schoolYear: SchoolYear): Promise<Group[]> {
  const groups: GroupEntity[] = await db.select(
    `
    SELECT * FROM ZGROUP
    INNER JOIN Z_3YEARS ON Z_PK = Z_3YEARS.Z_3GROUPS1 AND Z_3YEARS.Z_8YEARS = $1
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
  const existingGroups: CountResult[] = await db.select(
    `
    SELECT COUNT(*) FROM Z_3YEARS
    INNER JOIN ZGROUP ON Z_3YEARS.Z_3GROUPS1 = ZGROUP.Z_PK AND ZGROUP.ZNAME = $1
    WHERE Z_3YEARS.Z_8YEARS = $2
    `,
    [group.name, schoolYear.id],
  );

  if (existingGroups[0]["COUNT(*)"] > 0) {
    throw new Error(`Group ${group.name} already exists in school year ${schoolYear.id}`);
  }

  await withTransaction(async () => {
    const id = await nextPrimaryKey(Z_ENT.ZGROUP);
    const sortingName = group.name?.match(/^\d/) ? `0${group.name}` : group.name;
    await db.execute(
      `
      INSERT INTO ZGROUP (Z_PK, Z_ENT, Z_OPT, ZNAME, ZTYPE, ZSORTINGNAME)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [id, Z_ENT.ZGROUP, 1, group.name, group.type, sortingName],
    );

    await db.execute(
      `
      INSERT INTO Z_3YEARS (Z_8YEARS, Z_3GROUPS1)
      VALUES ($1, $2)
      `,
      [schoolYear.id, id],
    );
  });
}

export async function deleteGroupInSchoolYear(group: Group, schoolYear: SchoolYear) {
  await withTransaction(async () => {
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
      WHERE Z_PK IN (
        SELECT ZGRADE.Z_PK FROM ZGRADE
        INNER JOIN ZPERFORMANCE ON ZPERFORMANCE.Z_PK = ZGRADE.ZPERFORMANCE
        INNER JOIN ZCOURSE ON ZCOURSE.Z_PK = ZPERFORMANCE.ZCOURSE
        WHERE ZCOURSE.ZGROUP = $1
        AND ZCOURSE.ZYEAR = $2
      )
      `,
      [group.id, schoolYear.id],
    );

    await db.execute(
      `
      DELETE FROM ZPERFORMANCE
      WHERE Z_PK IN (
        SELECT ZPERFORMANCE.Z_PK FROM ZPERFORMANCE
        INNER JOIN ZCOURSE ON ZCOURSE.Z_PK = ZPERFORMANCE.ZCOURSE
        WHERE ZCOURSE.ZGROUP = $1
        AND ZCOURSE.ZYEAR = $2
      )
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
  });
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
  await withTransaction(async () => {
    await db.execute(
      `
      INSERT OR IGNORE INTO Z_3STUDENTS (Z_6STUDENTS1, Z_3GROUPS2)
      VALUES ($1, $2)
      `,
      [student.id, group.id],
    );

    type CourseRow = { Z_PK: number };
    const courses: CourseRow[] = await db.select(`SELECT Z_PK FROM ZCOURSE WHERE ZGROUP = $1`, [group.id]);

    for (const course of courses) {
      await db.execute(
        `
        INSERT OR IGNORE INTO Z_1STUDENTS (Z_1COURSES, Z_6STUDENTS)
        VALUES ($1, $2)
        `,
        [course.Z_PK, student.id],
      );

      type PerformanceRow = { Z_PK: number };
      const performances: PerformanceRow[] = await db.select(
        `
        SELECT Z_PK FROM ZPERFORMANCE
        WHERE ZCOURSE = $1
        AND Z_PK NOT IN (SELECT ZPERFORMANCE FROM ZGRADE WHERE ZSTUDENT = $2)
        `,
        [course.Z_PK, student.id],
      );
      for (const performance of performances) {
        const gradeId = await nextPrimaryKey(Z_ENT.ZGRADE);
        await db.execute(
          `
          INSERT INTO ZGRADE (Z_PK, Z_ENT, Z_OPT, ZPERFORMANCE, ZSTUDENT)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [gradeId, Z_ENT.ZGRADE, 1, performance.Z_PK, student.id],
        );
      }
    }
  });
}

export async function unassignStudentFromGroup(student: Student, group: Group) {
  await withTransaction(async () => {
    await db.execute(
      `
      DELETE FROM ZGRADE
      WHERE ZSTUDENT = $1
      AND ZPERFORMANCE IN (
        SELECT Z_PK FROM ZPERFORMANCE
        WHERE ZCOURSE IN (
          SELECT Z_PK FROM ZCOURSE WHERE ZGROUP = $2
        )
      )
      `,
      [student.id, group.id],
    );

    await db.execute(
      `
      DELETE FROM Z_1STUDENTS
      WHERE Z_6STUDENTS = $1
      AND Z_1COURSES IN (
        SELECT Z_PK FROM ZCOURSE WHERE ZGROUP = $2
      )
      `,
      [student.id, group.id],
    );

    await db.execute(
      `
      DELETE FROM Z_3STUDENTS
      WHERE Z_6STUDENTS1 = $1
      AND Z_3GROUPS2 = $2
      `,
      [student.id, group.id],
    );
  });
}
