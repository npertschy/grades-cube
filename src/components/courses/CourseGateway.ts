import type { Course } from "@/components/courses/Course";
import type { CourseEntity } from "@/components/courses/CourseEntity";
import type { Group } from "@/components/groups/Group";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import type { Subject } from "@/components/subjects/Subject";
import type { SubjectEntity } from "@/components/subjects/SubjectEntity";
import { db } from "@/store/Database";

type FullCourseEntity = CourseEntity & {
  GROUPID: number;
  GROUPNAME: string;
  SUBJECTID: number;
  SUBJECTNAME: string;
};

export class CourseGateway {
  async loadCoursesForSchoolYearAndSemester(schoolYear: SchoolYear, semester: Semester): Promise<Course[]> {
    const courses: FullCourseEntity[] = await db.select(
      `
        SELECT ZCOURSE.Z_PK, ZCOURSE.ZDAYS, ZGROUP.Z_PK AS GROUPID, ZGROUP.ZNAME AS GROUPNAME, ZSUBJECT.Z_PK AS SUBJECTID, ZSUBJECT.ZNAME AS SUBJECTNAME FROM ZCOURSE 
        INNER JOIN ZGROUP ON ZCOURSE.ZGROUP = ZGROUP.Z_PK
        INNER JOIN ZSUBJECT ON ZCOURSE.ZSUBJECT = ZSUBJECT.Z_PK
        WHERE ZYEAR = $1 
        AND ZSEMESTER = $2
    `,
      [schoolYear.id, semester.id],
    );

    return courses.map((course): Course => {
      return {
        id: course.Z_PK,
        group: {
          id: course.GROUPID,
          name: course.GROUPNAME,
          sortingName: undefined,
          type: undefined,
          students: [],
        },
        subject: {
          id: course.SUBJECTID,
          name: course.SUBJECTNAME,
        },
        semester: semester,
        schoolYear: schoolYear,
        days: course.ZDAYS,
      };
    });
  }

  async loadStudentsForCourse(course: Course): Promise<Student[]> {
    const students: StudentEntity[] = await db.select(
      `
      SELECT * FROM ZSTUDENT 
      INNER JOIN Z_1STUDENTS ON Z_PK = Z_1STUDENTS.Z_6STUDENTS 
      WHERE Z_1STUDENTS.Z_1COURSES = $1
      `,
      [course.id],
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

  async loadAvailableGroupsForSchoolYear(schoolYear: SchoolYear): Promise<Group[]> {
    const groups: GroupEntity[] = await db.select(
      `
      SELECT * FROM ZGROUP 
      INNER JOIN Z_3YEARS ON Z_PK = Z_3YEARS.Z_3GROUPS1
      WHERE Z_3YEARS.Z_8YEARS = $1
      `,
      [schoolYear.id],
    );

    return groups.map((group) => {
      return {
        id: group.Z_PK,
        name: group.ZNAME,
        type: group.ZTYPE,
        sortingName: group.ZSORTINGNAME,
        students: [],
      };
    });
  }

  async loadAvailableSubjectsForSchoolYear(schoolYear: SchoolYear): Promise<Subject[]> {
    const subjects: SubjectEntity[] = await db.select(
      `
      SELECT * FROM ZSUBJECT
      INNER JOIN Z_7YEARS ON Z_PK = Z_7YEARS.Z_7SUBJECTS
      WHERE Z_7YEARS.Z_8YEARS2 = $1
      `,
      [schoolYear.id],
    );

    return subjects.map((subject) => {
      return {
        id: subject.Z_PK,
        name: subject.ZNAME,
      };
    });
  }

  async createCourse(course: Course, schoolYear: SchoolYear, semester: Semester) {}

  async updateCourse(course: Course) {}

  async deleteCourseInSchoolYear(course: Course, schoolYear: SchoolYear, semester: Semester) {}

  async addStudentToCourse(student: Student, course: Course) {}

  async removeStudentFromCourse(student: Student, course: Course) {}
}
