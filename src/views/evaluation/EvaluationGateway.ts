import type { Course } from "@/components/courses/Course";
import type { FullCourseEntity } from "@/components/courses/CourseEntity";
import type { EvaluatedStudent, Grade } from "@/components/evaluations/EvaluatedStudent";
import type { EvaluatedStudentEntity } from "@/components/evaluations/EvaluatedStudentEntity";
import type { Performance, PerformanceType } from "@/components/evaluations/Performance";
import type { PerformanceEntity } from "@/components/evaluations/PerformanceEntity";
import type { Group } from "@/components/groups/Group";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import { db, nextPrimaryKey, withTransaction } from "@/store/Database";
import { dateToCoreData, coreDataToUnix } from "@/store/DateConversion";
import { Z_ENT } from "@/store/EntityId";

export async function loadCoursesForSchoolYearAndSemester(
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

export async function loadStudentsForCourse(course: Course): Promise<EvaluatedStudent[]> {
  const rows: EvaluatedStudentEntity[] = await db.select(
    `
      SELECT
        ZSTUDENT.Z_PK,
        ZSTUDENT.ZFIRSTNAME,
        ZSTUDENT.ZLASTNAME,
        ZGRADE.Z_PK AS GRADEID,
        ZGRADE.ZVALUE AS GRADEVALUE,
        ZPERFORMANCE.ZTITLE AS PERFORMANCETITLE,
        ZPERFORMANCE.ZTYPE AS PERFORMANCETYPE
      FROM ZSTUDENT
      INNER JOIN Z_1STUDENTS ON ZSTUDENT.Z_PK = Z_1STUDENTS.Z_6STUDENTS AND Z_1STUDENTS.Z_1COURSES = $1
      LEFT JOIN ZPERFORMANCE ON ZPERFORMANCE.ZCOURSE = $1
      LEFT JOIN ZGRADE ON ZGRADE.ZSTUDENT = ZSTUDENT.Z_PK AND ZGRADE.ZPERFORMANCE = ZPERFORMANCE.Z_PK
      ORDER BY ZSTUDENT.ZLASTNAME, ZSTUDENT.ZFIRSTNAME, ZPERFORMANCE.ZTYPE, ZPERFORMANCE.ZSORTORDER
      `,
    [course.id],
  );

  const studentsMap = new Map<number, EvaluatedStudent>();
  for (const row of rows) {
    let student = studentsMap.get(row.Z_PK);
    if (!student) {
      student = {
        student: {
          id: row.Z_PK,
          firstName: row.ZFIRSTNAME,
          lastName: row.ZLASTNAME,
          groups: [],
          courses: [],
        },
        grades: [],
      };
      studentsMap.set(row.Z_PK, student);
    }
    if (row.GRADEID != null) {
      student.grades.push({
        id: row.GRADEID,
        value: row.GRADEVALUE,
        performanceTitle: row.PERFORMANCETITLE,
        performanceType: row.PERFORMANCETYPE as PerformanceType,
      });
    }
  }
  return [...studentsMap.values()];
}

export async function loadPerformancesForCourse(course: Course): Promise<Performance[]> {
  const performances: PerformanceEntity[] = await db.select(
    `
      SELECT * from ZPERFORMANCE
      WHERE ZCOURSE = $1
      ORDER BY ZTYPE, ZSORTORDER
      `,
    [course.id],
  );

  return performances.map((performance): Performance => {
    return {
      id: performance.Z_PK,
      performanceId: `${performance.Z_PK}`,
      editable: performance.ZEDITABLE === 1,
      sortOrder: performance.ZSORTORDER,
      type: performance.ZTYPE as PerformanceType,
      courseId: performance.ZCOURSE,
      date: coreDataToUnix(performance.ZDATE),
      weight: performance.ZWEIGHT,
      title: performance.ZTITLE,
    };
  });
}

export async function loadStudentsForGroup(group: Group): Promise<Student[]> {
  const students: StudentEntity[] = await db.select(
    `
      SELECT Z_PK, ZFIRSTNAME, ZLASTNAME from ZSTUDENT
      INNER JOIN Z_3STUDENTS ON Z_PK = Z_3STUDENTS.Z_6STUDENTS1
      WHERE Z_3STUDENTS.Z_3GROUPS2 = $1
      ORDER BY ZLASTNAME, ZFIRSTNAME
      `,
    [group.id],
  );

  return students.map((student): Student => {
    return {
      id: student.Z_PK,
      firstName: student.ZFIRSTNAME,
      lastName: student.ZLASTNAME,
      groups: undefined,
      courses: undefined,
    };
  });
}

export async function createPerformance(performance: Performance, students: Student[]): Promise<void> {
  await withTransaction(async () => {
    const performanceId = await nextPrimaryKey(Z_ENT.ZPERFORMANCE);
    await db.execute(
      `
      INSERT INTO ZPERFORMANCE (Z_PK, Z_ENT, Z_OPT, ZEDITABLE, ZSORTORDER, ZTYPE, ZCOURSE, ZDATE, ZWEIGHT, ZTITLE)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        performanceId,
        Z_ENT.ZPERFORMANCE,
        1,
        performance.editable ? 1 : 0,
        performance.sortOrder,
        performance.type,
        performance.courseId,
        dateToCoreData(performance.date),
        performance.weight,
        performance.title,
      ],
    );

    for (const student of students) {
      const gradeId = await nextPrimaryKey(Z_ENT.ZGRADE);
      await db.execute(
        `
        INSERT INTO ZGRADE (Z_PK, Z_ENT, Z_OPT, ZPERFORMANCE, ZSTUDENT)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [gradeId, Z_ENT.ZGRADE, 1, performanceId, student.id],
      );
    }
  });
}

export async function updatePerformance(performance: Performance): Promise<void> {
  await db.execute(
    `
      UPDATE ZPERFORMANCE
      SET ZWEIGHT = $1, ZTITLE = $2, Z_OPT = Z_OPT + 1
      WHERE Z_PK = $3
      `,
    [performance.weight, performance.title, performance.id],
  );
}

export async function updateGrade(grade: Grade): Promise<void> {
  await db.execute(
    `
      UPDATE ZGRADE
      SET ZVALUE = $1, Z_OPT = Z_OPT + 1
      WHERE Z_PK = $2
      `,
    [grade.value, grade.id],
  );
}

export async function deletePerformance(performance: Performance): Promise<void> {
  await withTransaction(async () => {
    await db.execute(`DELETE FROM ZGRADE WHERE ZPERFORMANCE = $1`, [performance.id]);
    await db.execute(`DELETE FROM ZPERFORMANCE WHERE Z_PK = $1`, [performance.id]);
  });
}
