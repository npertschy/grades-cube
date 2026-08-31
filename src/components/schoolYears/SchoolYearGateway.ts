import type { SchoolYear } from "./SchoolYear";
import type { Semester } from "./Semester";
import type { SchoolYearEntity } from "./SchoolYearEntity";
import type { SemesterEntity } from "./SemesterEntity";
import { db, nextPrimaryKey, withTransaction } from "@/store/Database";
import { coreDataToUnix, dateToCoreData } from "@/store/DateConversion";
import { Z_ENT } from "@/store/EntityId";

export async function loadAll(): Promise<SchoolYear[]> {
  const years: SchoolYearEntity[] = await db.select("SELECT * FROM ZYEAR");

  const schoolYears: SchoolYear[] = [];

  for (const year of years) {
    const semesters: SemesterEntity[] = await db.select(
      "SELECT * FROM ZSEMESTER WHERE ZSEMESTER.ZYEAR = $1 ORDER BY ZTYPEID ASC",
      [year.Z_PK],
    );
    const firstSemester = semesters[0];
    const secondSemester = semesters[1];

    schoolYears.push({
      id: year.Z_PK,
      start: coreDataToUnix(year.ZSTART),
      end: coreDataToUnix(year.ZEND),
      firstSemester: {
        id: firstSemester.Z_PK,
        type: firstSemester.ZTYPEID,
        start: coreDataToUnix(firstSemester.ZSTART),
        end: coreDataToUnix(firstSemester.ZEND),
      },
      secondSemester: {
        id: secondSemester.Z_PK,
        type: secondSemester.ZTYPEID,
        start: coreDataToUnix(secondSemester.ZSTART),
        end: coreDataToUnix(secondSemester.ZEND),
      },
    });
  }

  return schoolYears;
}

export async function createSchoolYear(schoolYear: SchoolYear): Promise<SchoolYear> {
  return await withTransaction(async () => {
    const schoolYearStart = dateToCoreData(schoolYear.start!);
    const schoolYearEnd = dateToCoreData(schoolYear.end!);
    const yearId = await nextPrimaryKey(Z_ENT.ZYEAR);
    await db.execute(
      `
      INSERT INTO ZYEAR (Z_PK, Z_ENT, Z_OPT, ZEND, ZSTART)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [yearId, Z_ENT.ZYEAR, 1, schoolYearEnd, schoolYearStart],
    );

    const firstSemesterId = await createSemester(schoolYear.firstSemester!, yearId);
    const secondSemesterId = await createSemester(schoolYear.secondSemester!, yearId);
    return {
      ...schoolYear,
      id: yearId,
      firstSemester: { ...schoolYear.firstSemester!, id: firstSemesterId },
      secondSemester: { ...schoolYear.secondSemester!, id: secondSemesterId },
    };
  });
}

async function createSemester(semester: Semester, schoolYearId: number): Promise<number> {
  const semesterStart = dateToCoreData(semester.start!);
  const semesterEnd = dateToCoreData(semester.end!);
  const semesterId = await nextPrimaryKey(Z_ENT.ZSEMESTER);
  await db.execute(
    `
    INSERT INTO ZSEMESTER (Z_PK, Z_ENT, Z_OPT, ZTYPEID, ZYEAR, ZEND, ZSTART)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [semesterId, Z_ENT.ZSEMESTER, 1, semester.type, schoolYearId, semesterEnd, semesterStart],
  );
  return semesterId;
}

export async function updateSchoolYear(schoolYear: SchoolYear) {
  await withTransaction(async () => {
    const schoolYearStart = dateToCoreData(schoolYear.start!);
    const schoolYearEnd = dateToCoreData(schoolYear.end!);
    await db.execute(
      `
      UPDATE ZYEAR
      SET ZEND = $1, ZSTART = $2, Z_OPT = Z_OPT + 1
      WHERE Z_PK = $3
      `,
      [schoolYearEnd, schoolYearStart, schoolYear.id],
    );

    await updateSemester(schoolYear.firstSemester!);
    await updateSemester(schoolYear.secondSemester!);
  });
}

async function updateSemester(semester: Semester) {
  const semesterStart = dateToCoreData(semester.start!);
  const semesterEnd = dateToCoreData(semester.end!);
  await db.execute(
    `
    UPDATE ZSEMESTER
    SET ZEND = $1, ZSTART = $2, Z_OPT = Z_OPT + 1
    WHERE Z_PK = $3
    `,
    [semesterEnd, semesterStart, semester.id],
  );
}

export async function deleteSchoolYear(schoolYear: SchoolYear) {
  await withTransaction(async () => {
    await db.execute(
      `
      DELETE FROM ZGRADE
      WHERE Z_PK IN (
        SELECT ZGRADE.Z_PK FROM ZGRADE
        INNER JOIN ZPERFORMANCE ON ZPERFORMANCE.Z_PK = ZGRADE.ZPERFORMANCE
        INNER JOIN ZCOURSE ON ZCOURSE.Z_PK = ZPERFORMANCE.ZCOURSE
        WHERE ZCOURSE.ZYEAR = $1
      )
      `,
      [schoolYear.id],
    );
    await db.execute(
      `
      DELETE FROM ZPERFORMANCE
      WHERE Z_PK IN (
        SELECT ZPERFORMANCE.Z_PK FROM ZPERFORMANCE
        INNER JOIN ZCOURSE ON ZCOURSE.Z_PK = ZPERFORMANCE.ZCOURSE
        WHERE ZCOURSE.ZYEAR = $1
      )
      `,
      [schoolYear.id],
    );
    await db.execute(
      `
      DELETE FROM Z_1STUDENTS
      WHERE Z_1COURSES IN (
        SELECT Z_PK FROM ZCOURSE WHERE ZYEAR = $1
      )
      `,
      [schoolYear.id],
    );
    await db.execute(`DELETE FROM ZCOURSE WHERE ZYEAR = $1`, [schoolYear.id]);
    await db.execute(`DELETE FROM Z_3YEARS WHERE Z_8YEARS = $1`, [schoolYear.id]);
    await db.execute(`DELETE FROM Z_6YEARS WHERE Z_8YEARS1 = $1`, [schoolYear.id]);
    await db.execute(`DELETE FROM Z_7YEARS WHERE Z_8YEARS2 = $1`, [schoolYear.id]);
    await db.execute(`DELETE FROM ZSEMESTER WHERE ZYEAR = $1`, [schoolYear.id]);
    await db.execute(`DELETE FROM ZYEAR WHERE Z_PK = $1`, [schoolYear.id]);
  });
}
