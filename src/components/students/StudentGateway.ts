import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import { db, type CountResult } from "@/store/Database";
import type { QueryResult } from "@tauri-apps/plugin-sql";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { Group } from "@/components/groups/Group";
import type { CourseEntity } from "@/components/courses/CourseEntity";
import type { Course } from "@/components/courses/Course";
import type { SubjectEntity } from "@/components/subjects/SubjectEntity";
import type { Semester } from "@/components/schoolYears/Semester";

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

type StudentsToCourses = {
  Z_1COURSES: number
  Z_6STUDENTS: number
}

export class StudentGateway {

  async loadAllStudentsForSchoolYear(schoolYear: SchoolYear, semester: Semester): Promise<Student[]> {
    const studentsPerYear: StudentsToYears[] = await db.select("SELECT Z_6STUDENTS2 from Z_6YEARS WHERE Z_8YEARS1 = $1", [schoolYear.id]);
    if (studentsPerYear.length == 0) {
      return [];
    }

    const studentIds = studentsPerYear.map((item) => { return item.Z_6STUDENTS2 });
    const studentsOrQuery = this.orQuery(studentIds, "Z_PK", 1);
    const students: StudentEntity[] = await db.select("SELECT * FROM ZSTUDENT WHERE " + studentsOrQuery, studentIds);


    return await Promise.all(students.map(async (student) => {
      return {
        id: student.Z_PK,
        firstName: student.ZFIRSTNAME,
        lastName: student.ZLASTNAME,
        groups: undefined,
        courses: undefined
      };
    }));
  }

  async loadGroupsAndCoursesForStudent(student: Student, schoolYear: SchoolYear, semester: Semester): Promise<Student> {
    const groups: GroupsToYears[] = await db.select("SELECT Z_3GROUPS1 FROM Z_3YEARS WHERE Z_8YEARS = $1", [schoolYear.id]);
    const groupIds = groups.map((item) => { return item.Z_3GROUPS1 });
    const groupsOrQuery = this.orQuery(groupIds, "Z_3GROUPS2", 2);

    const courses: CourseEntity[] = await db.select("SELECT * FROM ZCOURSE WHERE ZYEAR = $1 AND ZSEMESTER = $2", [schoolYear.id, semester.id]);
    const courseIds = courses.map((item) => { return item.Z_PK });
    const coursesOrQuery = this.orQuery(courseIds, "Z_1COURSES", 2);

    const groupsOfStudent: StudentsToGroups[] = await db.select("SELECT Z_3GROUPS2 FROM Z_3STUDENTS WHERE Z_6STUDENTS1 = $1 AND (" + groupsOrQuery + ")", [student.id, ...groupIds]);
    const groupIdsForStudent = groupsOfStudent.map((item) => { return item.Z_3GROUPS2 });
    const groupEntityOrQuery = this.orQuery(groupIdsForStudent, "Z_PK", 1);
    const groupEntities: GroupEntity[] = groupIdsForStudent.length > 0
      ? await db.select("SELECT * FROM ZGROUP WHERE " + groupEntityOrQuery, groupIdsForStudent)
      : [];

    const coursesOfStudent: StudentsToCourses[] = await db.select("SELECT Z_1COURSES FROM Z_1STUDENTS WHERE Z_6STUDENTS = $1 AND (" + coursesOrQuery + ")", [student.id, ...courseIds]);
    const courseIdsForStudent = coursesOfStudent.map((item) => { return item.Z_1COURSES });
    const courseEntities = courses.filter((item) => { return courseIdsForStudent.includes(item.Z_PK) })
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      groups: groupEntities.map((item): Group => {
        return {
          id: item.Z_PK,
          name: item.ZNAME,
          students: undefined
        }
      }),
      courses: await Promise.all(courseEntities.map(async (item): Promise<Course> => {
        const groupOfCourse: GroupEntity[] = await db.select("SELECT * FROM ZGROUP WHERE Z_PK = $1", [item.ZGROUP]);
        const subjectOfCourse: SubjectEntity[] = await db.select("SELECT * FROM ZSUBJECT WHERE Z_PK = $1", [item.ZSUBJECT]);
        return {
          id: item.Z_PK,
          group: {
            id: groupOfCourse[0].Z_PK,
            name: groupOfCourse[0].ZNAME,
            students: undefined
          },
          semester: undefined,
          subject: {
            id: subjectOfCourse[0] ? subjectOfCourse[0].Z_PK : undefined,
            name: subjectOfCourse[0] ? subjectOfCourse[0].ZNAME : undefined
          },
          schoolYear: schoolYear,
          days: undefined
        }
      }))
    };
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
