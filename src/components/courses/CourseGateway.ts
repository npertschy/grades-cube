import type { Course } from "@/components/courses/Course";
import type { FullCourseEntity } from "@/components/courses/CourseEntity";
import { insertDefaultPerformancesWithGrades } from "@/components/courses/DefaultPerformances";
import type { Group } from "@/components/groups/Group";
import type { GroupEntity } from "@/components/groups/GroupEntity";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import type { Subject } from "@/components/subjects/Subject";
import type { SubjectEntity } from "@/components/subjects/SubjectEntity";
import { db, nextPrimaryKey, withTransaction } from "@/store/Database";
import { Z_ENT } from "@/store/EntityId";

export async function loadCoursesBySchoolYearAndSemester(
  schoolYear: SchoolYear,
  semester: Semester,
): Promise<Course[]> {
  const courses: FullCourseEntity[] = await db.select(
    `
        SELECT 
            ZCOURSE.Z_PK,
            ZCOURSE.ZDAYS,
            ZCOURSE.ZLEVEL,
            ZCOURSE.ZORDINAL,
            ZGROUP.Z_PK AS GROUPID,
            ZGROUP.ZNAME AS GROUPNAME,
            ZGROUP.ZTYPE AS GROUPTYPE,
            ZSUBJECT.Z_PK AS SUBJECTID,
            ZSUBJECT.ZNAME AS SUBJECTNAME
        FROM ZCOURSE
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
        type: course.GROUPTYPE,
        students: [],
      },
      subject: {
        id: course.SUBJECTID,
        name: course.SUBJECTNAME,
      },
      semester: semester,
      schoolYear: schoolYear,
      days: course.ZDAYS,
      level: course.ZLEVEL,
      ordinal: course.ZORDINAL,
    };
  });
}

export async function loadStudentsByCourse(course: Course): Promise<Student[]> {
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

export async function loadAvailableGroupsBySchoolYear(schoolYear: SchoolYear): Promise<Group[]> {
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

export async function loadAvailableSubjectsBySchoolYear(schoolYear: SchoolYear): Promise<Subject[]> {
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

export async function createCourse(course: Course, schoolYear: SchoolYear, semester: Semester) {
  await withTransaction(async () => {
    const id = await nextPrimaryKey(Z_ENT.ZCOURSE);
    const type = course.group?.type ?? 0;
    const ordinal = type === 1 ? await getNextOrdinal(schoolYear, course.subject!, course.level!) : 0;
    await db.execute(
      `
      INSERT INTO ZCOURSE (Z_PK, Z_ENT, Z_OPT, ZGROUP, ZSUBJECT, ZSEMESTER, ZYEAR, ZDAYS, ZLEVEL, ZORDINAL)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        id,
        Z_ENT.ZCOURSE,
        1,
        course.group!.id,
        course.subject!.id,
        semester.id,
        schoolYear.id,
        course.days ?? null,
        course.level ?? null,
        ordinal,
      ],
    );
    await insertDefaultPerformancesWithGrades(id, course.group?.type, []);
  });
}

export async function updateCourse(course: Course) {
  await db.execute(
    `
    UPDATE ZCOURSE
    SET ZGROUP = $1, ZSUBJECT = $2, ZDAYS = $3, Z_OPT = Z_OPT + 1
    WHERE Z_PK = $4
    `,
    [course.group!.id, course.subject!.id, course.days ?? null, course.id],
  );
}

export async function deleteCourseInSchoolYear(course: Course) {
  await withTransaction(async () => {
    await db.execute(
      `
      DELETE FROM ZGRADE
      WHERE Z_PK IN (
        SELECT ZGRADE.Z_PK FROM ZGRADE
        INNER JOIN ZPERFORMANCE ON ZPERFORMANCE.Z_PK = ZGRADE.ZPERFORMANCE
        WHERE ZPERFORMANCE.ZCOURSE = $1
      )
      `,
      [course.id],
    );
    await db.execute(
      `
      DELETE FROM ZPERFORMANCE
      WHERE ZCOURSE = $1
      `,
      [course.id],
    );
    await db.execute(
      `
      DELETE FROM Z_1STUDENTS
      WHERE Z_1COURSES = $1
      `,
      [course.id],
    );
    await db.execute(
      `
      DELETE FROM ZCOURSE
      WHERE Z_PK = $1
      `,
      [course.id],
    );
  });
}

export async function assignStudentToCourse(student: Student, course: Course) {
  await withTransaction(async () => {
    await db.execute(
      `
      INSERT OR IGNORE INTO Z_1STUDENTS (Z_1COURSES, Z_6STUDENTS)
      VALUES ($1, $2)
      `,
      [course.id, student.id],
    );

    // Cascade to the group: the student becomes a member of the course's group.
    await db.execute(
      `
      INSERT OR IGNORE INTO Z_3STUDENTS (Z_3GROUPS2, Z_6STUDENTS1)
      SELECT ZGROUP, $2 FROM ZCOURSE WHERE Z_PK = $1
      `,
      [course.id, student.id],
    );

    type PerformanceRow = { Z_PK: number };
    const performances: PerformanceRow[] = await db.select(
      `
      SELECT Z_PK FROM ZPERFORMANCE
      WHERE ZCOURSE = $1
      AND Z_PK NOT IN (SELECT ZPERFORMANCE FROM ZGRADE WHERE ZSTUDENT = $2)
      `,
      [course.id, student.id],
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
  });
}

export async function unassignStudentFromCourse(student: Student, course: Course) {
  await withTransaction(async () => {
    await db.execute(
      `
      DELETE FROM ZGRADE
      WHERE ZSTUDENT = $1
      AND ZPERFORMANCE IN (
        SELECT Z_PK FROM ZPERFORMANCE WHERE ZCOURSE = $2
      )
      `,
      [student.id, course.id],
    );
    await db.execute(
      `
      DELETE FROM Z_1STUDENTS
      WHERE Z_1COURSES = $1
      AND Z_6STUDENTS = $2
      `,
      [course.id, student.id],
    );
  });
}

async function getNextOrdinal(schoolYear: SchoolYear, subject: Subject, level: number): Promise<number> {
  type ResultRow = { maxOrdinal: number | null };
  const result: ResultRow[] = await db.select(
    `
        SELECT MAX(ZORDINAL) AS maxOrdinal
        FROM ZCOURSE
        WHERE ZYEAR = $1 AND ZSUBJECT = $2 AND ZLEVEL = $3
        `,
    [schoolYear.id, subject.id, level],
  );

  const maxOrdinal = result[0]?.maxOrdinal ?? 0;

  return maxOrdinal + 1;
}
