import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import { db, type CountResult } from "@/store/Database";
import type { QueryResult } from "@tauri-apps/plugin-sql";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { Group } from "@/components/groups/Group";
import type { CourseEntity } from "@/components/courses/CourseEntity";
import type { Course } from "@/components/courses/Course";
import type { Semester } from "@/components/schoolYears/Semester";

type FullCourse = CourseEntity & {
  GROUPNAME: string;
  SUBJECTNAME: string;
};

export class StudentGateway {
  async loadAllStudentsForSchoolYear(schoolYear: SchoolYear): Promise<Student[]> {
    const students: StudentEntity[] = await db.select(
      "SELECT * FROM ZSTUDENT INNER JOIN Z_6YEARS ON Z_PK = Z_6YEARS.Z_6STUDENTS2 WHERE Z_6YEARS.Z_8YEARS1 = $1",
      [schoolYear.id],
    );

    return await Promise.all(
      students.map(async (student) => {
        return {
          id: student.Z_PK,
          firstName: student.ZFIRSTNAME,
          lastName: student.ZLASTNAME,
          groups: undefined,
          courses: undefined,
        };
      }),
    );
  }

  async loadGroupsAndCoursesForStudent(student: Student, schoolYear: SchoolYear, semester: Semester): Promise<Student> {
    const groupEntities: GroupEntity[] = await db.select(
      "SELECT * FROM ZGROUP INNER JOIN Z_3YEARS ON Z_PK = Z_3YEARS.Z_3GROUPS1 INNER JOIN Z_3STUDENTS ON Z_PK = Z_3STUDENTS.Z_3GROUPS2 WHERE Z_3YEARS.Z_8YEARS = $1 AND Z_3STUDENTS.Z_6STUDENTS1 = $2",
      [schoolYear.id, student.id],
    );

    const courseEntities: FullCourse[] = await db.select(
      `SELECT 
          ZCOURSE.Z_PK,
          ZCOURSE.ZSUBJECT,
          ZCOURSE.ZGROUP, 
          ZGROUP.ZNAME AS GROUPNAME,
          ZSUBJECT.ZNAME AS SUBJECTNAME 
        FROM ZCOURSE 
          INNER JOIN Z_1STUDENTS ON ZCOURSE.Z_PK = Z_1STUDENTS.Z_1COURSES 
          INNER JOIN ZGROUP ON ZCOURSE.ZGROUP = ZGROUP.Z_PK 
          INNER JOIN ZSUBJECT ON ZCOURSE.ZSUBJECT = ZSUBJECT.Z_PK 
        WHERE Z_1STUDENTS.Z_6STUDENTS = $1 
        AND ZYEAR = $2 
        AND ZSEMESTER = $3`,
      [student.id, schoolYear.id, semester.id],
    );

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      groups: groupEntities.map((item): Group => {
        return {
          id: item.Z_PK,
          name: item.ZNAME,
          sortingName: item.ZSORTINGNAME,
          students: undefined,
          type: undefined,
        };
      }),
      courses: courseEntities.map((item): Course => {
        return {
          id: item.Z_PK,
          group: {
            id: item.ZGROUP,
            name: item.GROUPNAME,
            sortingName: undefined,
            students: undefined,
            type: undefined,
          },
          semester: semester,
          subject: {
            id: item.ZSUBJECT,
            name: item.SUBJECTNAME,
          },
          schoolYear: schoolYear,
          days: undefined,
        };
      }),
    };
  }

  async createStudentInSchoolYear(student: Student, schoolYear: SchoolYear) {
    const studentId: QueryResult = await db.execute(
      "INSERT INTO ZSTUDENT (Z_ENT, ZFIRSTNAME, ZLASTNAME) VALUES ($1, $2, $3)",
      [6, student.firstName, student.lastName],
    );
    await db.execute("INSERT INTO Z_6YEARS (Z_6STUDENTS2, Z_8YEARS1) VALUES ($1, $2)", [
      studentId.lastInsertId,
      schoolYear.id,
    ]);
  }

  async deleteStudentInSchoolYear(student: Student, schoolYear: SchoolYear) {
    await db.execute("DELETE FROM Z_6YEARS WHERE Z_6STUDENTS2 = $1 AND Z_8YEARS1 = $2", [student.id, schoolYear.id]);
    const count: CountResult = await db.select("SELECT COUNT(*) FROM Z_6YEARS WHERE Z_6STUDENTS2 = $1", [student.id]);
    if (count["COUNT(*)"] === 0) {
      await db.execute("DELETE FROM ZSTUDENT WHERE Z_PK = $1", [student.id]);
    }
  }

  async loadGroupsForSchoolYear(schoolYear: SchoolYear): Promise<Group[]> {
    const groups: GroupEntity[] = await db.select(
      "SELECT * FROM ZGROUP INNER JOIN Z_3YEARS ON Z_PK = Z_3YEARS.Z_3GROUPS1 WHERE Z_3YEARS.Z_8YEARS = $1",
      [schoolYear.id],
    );
    return groups.map((group): Group => {
      return {
        id: group.Z_PK,
        name: group.ZNAME,
        sortingName: group.ZSORTINGNAME,
        students: [],
        type: group.ZTYPE,
      };
    });
  }

  async loadCoursesForSchoolYearAndSemester(schoolYear: SchoolYear, semester: Semester): Promise<Course[]> {
    const courses: FullCourse[] = await db.select(
      "SELECT ZCOURSE.Z_PK, ZCOURSE.ZSUBJECT, ZCOURSE.ZGROUP, ZGROUP.ZNAME AS GROUPNAME, ZSUBJECT.ZNAME AS SUBJECTNAME FROM ZCOURSE INNER JOIN ZGROUP ON ZCOURSE.ZGROUP = ZGROUP.Z_PK INNER JOIN ZSUBJECT ON ZCOURSE.ZSUBJECT = ZSUBJECT.Z_PK AND ZYEAR = $1 AND ZSEMESTER = $2",
      [schoolYear.id, semester.id],
    );
    return Promise.all(
      courses.map((course): Course => {
        return {
          id: course.Z_PK,
          group: {
            id: course.ZGROUP,
            name: course.GROUPNAME,
            sortingName: undefined,
            students: undefined,
            type: undefined,
          },
          semester: semester,
          subject: {
            id: course.ZSUBJECT,
            name: course.SUBJECTNAME,
          },
          schoolYear: schoolYear,
          days: undefined,
        };
      }),
    );
  }
}
