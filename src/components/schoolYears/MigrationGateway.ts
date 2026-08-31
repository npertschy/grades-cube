import { getNextOrdinal, insertCourse } from "@/components/courses/CourseGateway";
import type { Course } from "@/components/courses/Course";
import type { CourseEntity } from "@/components/courses/CourseEntity";
import { insertDefaultPerformancesWithGrades } from "@/components/courses/DefaultPerformances";
import { insertGroup, loadGroupsBySchoolYearAndSemester, loadStudentsByGroup } from "@/components/groups/GroupGateway";
import type { Group } from "@/components/groups/Group";
import type { SchoolYearMigrationPlan } from "@/components/schoolYears/Migration";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";
import { linkSubjectToSchoolYear } from "@/components/subjects/SubjectGateway";
import { db, orQuery, withTransaction } from "@/store/Database";

type MigratableCourseEntity = CourseEntity & {
  GROUPNAME: string;
  GROUPTYPE: number;
  SUBJECTNAME: string;
  SEMESTERTYPE: 1 | 2;
};

export async function loadMigratableGroups(sourceYear: SchoolYear): Promise<Group[]> {
  const groups = await loadGroupsBySchoolYearAndSemester(sourceYear);
  await Promise.all(
    groups.map(async (group) => {
      group.students = await loadStudentsByGroup(group);
    }),
  );
  return groups;
}

export async function loadMigrationStudents(): Promise<Student[]> {
  const students: StudentEntity[] = await db.select(`SELECT * FROM ZSTUDENT ORDER BY ZLASTNAME, ZFIRSTNAME`);
  return students.map((student) => ({
    id: student.Z_PK,
    firstName: student.ZFIRSTNAME,
    lastName: student.ZLASTNAME,
    groups: [],
    courses: [],
  }));
}

export async function loadMigratableCourses(sourceYear: SchoolYear, groupIds: number[]): Promise<Course[]> {
  if (groupIds.length === 0) return [];

  const courses: MigratableCourseEntity[] = await db.select(
    `
    SELECT
      ZCOURSE.*,
      ZGROUP.ZNAME AS GROUPNAME,
      ZGROUP.ZTYPE AS GROUPTYPE,
      ZSUBJECT.ZNAME AS SUBJECTNAME,
      ZSEMESTER.ZTYPEID AS SEMESTERTYPE
    FROM ZCOURSE
    INNER JOIN ZGROUP ON ZCOURSE.ZGROUP = ZGROUP.Z_PK
    INNER JOIN ZSUBJECT ON ZCOURSE.ZSUBJECT = ZSUBJECT.Z_PK
    INNER JOIN ZSEMESTER ON ZCOURSE.ZSEMESTER = ZSEMESTER.Z_PK
    WHERE ZCOURSE.ZYEAR = $1
      AND (${orQuery(groupIds, "ZCOURSE.ZGROUP", 2)})
    ORDER BY ZSEMESTER.ZTYPEID, ZGROUP.ZSORTINGNAME, ZSUBJECT.ZNAME
    `,
    [sourceYear.id, ...groupIds],
  );

  return courses.map((course) => ({
    id: course.Z_PK,
    group: {
      id: course.ZGROUP,
      name: course.GROUPNAME,
      sortingName: undefined,
      type: course.GROUPTYPE,
      students: [],
    },
    subject: { id: course.ZSUBJECT, name: course.SUBJECTNAME },
    semester: {
      ...(course.SEMESTERTYPE === 1 ? sourceYear.firstSemester! : sourceYear.secondSemester!),
      type: course.SEMESTERTYPE,
    },
    schoolYear: sourceYear,
    days: course.ZDAYS,
    level: course.ZLEVEL,
    ordinal: course.ZORDINAL,
  }));
}

export async function migrateSchoolYear(plan: SchoolYearMigrationPlan): Promise<void> {
  const selectedGroups = plan.groups.filter((selection) => selection.selected);
  if (selectedGroups.length === 0) return;

  await withTransaction(async () => {
    const targetYearId = plan.targetYear.id!;
    const courses = await loadMigratableCourses(
      plan.sourceYear,
      selectedGroups.map((selection) => selection.group.id!),
    );

    const groupIdMapping: Record<number, number> = {};

    for (const selection of selectedGroups) {
      const groupId = await insertGroup({ ...selection.group, name: selection.newName }, plan.targetYear);
      groupIdMapping[selection.group.id!] = groupId;

      for (const { student, included } of selection.students) {
        if (!included) continue;
        await db.execute(`INSERT OR IGNORE INTO Z_6YEARS (Z_6STUDENTS2, Z_8YEARS1) VALUES ($1, $2)`, [
          student.id,
          targetYearId,
        ]);
        await db.execute(`INSERT OR IGNORE INTO Z_3STUDENTS (Z_6STUDENTS1, Z_3GROUPS2) VALUES ($1, $2)`, [
          student.id,
          groupId,
        ]);
      }
    }

    const subjectIds = new Set(courses.map((course) => course.subject!.id!));
    for (const subjectId of subjectIds) {
      await linkSubjectToSchoolYear(subjectId, targetYearId);
    }

    for (const course of courses) {
      const selection = selectedGroups.find((item) => item.group.id === course.group!.id)!;
      const students = selection.students.filter((item) => item.included).map((item) => item.student);
      const level = course.group!.type === 1 ? (course.level ?? 1) : 0;
      const ordinal = course.group!.type === 1 ? await getNextOrdinal(plan.targetYear, course.subject!, level) : null;

      for (const targetSemester of [plan.targetYear.firstSemester!, plan.targetYear.secondSemester!]) {
        const newCourseId = await insertCourse({
          groupId: groupIdMapping[course.group!.id!],
          subjectId: course.subject!.id!,
          semesterId: targetSemester.id!,
          schoolYearId: targetYearId,
          days: course.days,
          level,
          ordinal,
        });

        for (const student of students) {
          await db.execute(`INSERT OR IGNORE INTO Z_1STUDENTS (Z_1COURSES, Z_6STUDENTS) VALUES ($1, $2)`, [
            newCourseId,
            student.id,
          ]);
        }
        await insertDefaultPerformancesWithGrades(newCourseId, course.group!.type, students);
      }
    }
  });
}
