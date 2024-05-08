import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import { db, type CountResult } from "@/store/Database";
import type { QueryResult } from "@tauri-apps/plugin-sql";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { Group } from "@/components/groups/Group";

type StudentsToYears = {
  Z_6STUDENTS2: number
  Z_8YEARS1: number
}

type GroupsToYears = {
  Z_3GROUPS1: number
  Z_8YEARS: number
}

type StudentsToGroups = {
  Z_3GROUPS2: number
  Z_6STUDENTS1: number
}
export class StudentGateway {

  async loadAllStudentsForSchoolYear(schoolYear: SchoolYear): Promise<Student[]> {
    const studentIds: StudentsToYears[] = await db.select("SELECT Z_6STUDENTS2 from Z_6YEARS WHERE Z_8YEARS1 = $1", [schoolYear.id]);
    if (studentIds.length == 0) {
    const studentsPerYear: StudentsToYears[] = await db.select("SELECT Z_6STUDENTS2 from Z_6YEARS WHERE Z_8YEARS1 = $1", [schoolYear.id]);
    if (studentsPerYear.length == 0) {
      return [];
    }

    const ids = studentIds.map((item) => { return item.Z_6STUDENTS2 });
    const orQuery = ids.map((value, index) => {
      return "Z_PK = $" + (index + 1);
    })
      .join(" OR ");
    const students: StudentEntity[] = await db.select("SELECT * FROM ZSTUDENT WHERE " + orQuery, ids);
    const studentIds = studentsPerYear.map((item) => { return item.Z_6STUDENTS2 });
    const studentsOrQuery = this.orQuery(studentIds, "Z_PK", 1);
    const students: StudentEntity[] = await db.select("SELECT * FROM ZSTUDENT WHERE " + studentsOrQuery, studentIds);

    const groups: GroupsToYears[] = await db.select("SELECT Z_3GROUPS1 FROM Z_3YEARS WHERE Z_8YEARS = $1", [schoolYear.id]);
    const groupIds = groups.map((item) => { return item.Z_3GROUPS1 });
    const groupsOrQuery = this.orQuery(groupIds, "Z_3GROUPS2", 2);

    return students.map((student) => {
    return await Promise.all(students.map(async (student) => {
      const groupsOfStudent: StudentsToGroups[] = await db.select("SELECT Z_3GROUPS2 FROM Z_3STUDENTS WHERE Z_6STUDENTS1 = $1 AND (" + groupsOrQuery + ")", [student.Z_PK, ...groupIds]);
      const groupIdsForStudent = groupsOfStudent.map((item) => { return item.Z_3GROUPS2 });
      const groupEntityOrQuery = this.orQuery(groupIdsForStudent, "Z_PK", 1);
      const groupEntities: GroupEntity[] = groupIdsForStudent.length > 0
        ? await db.select("SELECT * FROM ZGROUP WHERE " + groupEntityOrQuery, groupIdsForStudent)
        : [];
      return {
        id: student.Z_PK,
        firstName: student.ZFIRSTNAME,
        lastName: student.ZLASTNAME,
        groups: groupEntities.map((item): Group => {
          return {
            id: item.Z_PK,
            name: item.ZNAME,
            students: undefined
          }
        }),
      };
    });
    }));
  }

  private orQuery(ids: number[], column: string, offset: number) {
    return ids.map((value, index) => {
      return `${column} = $` + (index + offset);
    }).join(" OR ");
  }

  async createStudentInSchoolYear(student: Student, schoolYear: SchoolYear) {
    const studentId: QueryResult = await db.execute("INSERT INTO ZSTUDENT (Z_ENT, ZFIRSTNAME, ZLASTNAME) VALUES ($1, $2, $3)", [6, student.firstName, student.lastName]);
    await db.execute("INSERT INTO Z_6YEARS (Z_6STUDENTS2, Z_8YEARS1) VALUES ($1, $2)", [studentId.lastInsertId, schoolYear.id]);
  }

  async deleteStudentInSchoolYear(student: Student, schoolYear: SchoolYear) {
    await db.execute("DELETE FROM Z_6YEARS WHERE Z_6STUDENTS2 = $1 AND Z_8YEARS1 = $2", [student.id, schoolYear.id]);
    const count: CountResult = await db.select("SELECT COUNT(*) FROM Z_6YEARS WHERE Z_6STUDENTS2 = $1", [student.id]);
    if (count["COUNT(*)"] === 0) {
      await db.execute("DELETE FROM ZSTUDENT WHERE Z_PK = $1", [student.id]);
    }
  }
}
