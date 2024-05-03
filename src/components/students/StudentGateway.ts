import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import { db, type CountResult } from "@/store/Database";
import type { QueryResult } from "@tauri-apps/plugin-sql";

type StudentsToYears = {
  Z_6STUDENTS2: number
  Z_8YEARS1: number
}

export class StudentGateway {

  async loadAllStudentsForSchoolYear(schoolYear: SchoolYear): Promise<Student[]> {
    const studentIds: StudentsToYears[] = await db.select("SELECT Z_6STUDENTS2 from Z_6YEARS WHERE Z_8YEARS1 = $1", [schoolYear.id]);
    if (studentIds.length == 0) {
      return [];
    }

    const ids = studentIds.map((item) => { return item.Z_6STUDENTS2 });
    const orQuery = ids.map((value, index) => {
      return "Z_PK = $" + (index + 1);
    })
      .reduce((pre, cur): string => pre + " OR " + cur, "");
    const students: StudentEntity[] = await db.select("SELECT * FROM ZSTUDENT WHERE " + orQuery, ids);

    return students.map((student) => {
      return {
        id: student.Z_PK,
        firstName: student.ZFIRSTNAME,
        lastName: student.ZLASTNAME,
      };
    });
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
