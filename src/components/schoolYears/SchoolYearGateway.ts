import Database, { type QueryResult } from "@tauri-apps/plugin-sql";
import { appLocalDataDir } from "@tauri-apps/api/path";
import type { SchoolYear } from "./SchoolYear";
import type { Semester } from "./Semester";
import type { SchoolYearEntity } from "./SchoolYearEntity";
import type { SemesterEntity } from "./SemesterEntity";
import { coreDataToUnix, dateToCoreData } from "@/store/Database";

const path = (await appLocalDataDir()) + "/db/Notenwuerfel.sqlite";
const db = await Database.load("sqlite:" + path);

export async function loadAll(): Promise<SchoolYear[]> {
  const years: SchoolYearEntity[] = await db.select("SELECT * FROM ZYEAR");

  const schoolYears: SchoolYear[] = [];

  for (const year of years) {
    const semesters: SemesterEntity[] = await db.select(
      "SELECT * FROM ZSEMESTER WHERE ZSEMESTER.ZYEAR = $1 ORDER BY ZTYPEID ASC",
      [year.Z_PK],
    );

    schoolYears.push({
      id: year.Z_PK,
      start: coreDataToUnix(year.ZSTART),
      end: coreDataToUnix(year.ZEND),
      firstSemester: {
        id: semesters[0].Z_PK,
        type: 1,
        start: coreDataToUnix(semesters[0].ZSTART),
        end: coreDataToUnix(semesters[0].ZEND),
      },
      secondSemester: {
        id: semesters[1].Z_PK,
        type: 2,
        start: coreDataToUnix(semesters[1].ZSTART),
        end: coreDataToUnix(semesters[1].ZEND),
      },
    });
  }

  return schoolYears;
}

export async function createSchoolYear(schoolYear: SchoolYear) {
  const schoolYearStart = dateToCoreData(schoolYear.start!);
  const schoolYearEnd = dateToCoreData(schoolYear.end!);
  const newSchoolYear: QueryResult = await db.execute("INSERT INTO ZYEAR (Z_ENT, ZEND, ZSTART) VALUES ($1, $2, $3)", [
    8,
    schoolYearEnd,
    schoolYearStart,
  ]);

  await createSemester(schoolYear.firstSemester!, newSchoolYear.lastInsertId);
  await createSemester(schoolYear.secondSemester!, newSchoolYear.lastInsertId);
}

async function createSemester(semester: Semester, schoolYearId: number) {
  const semesterStart = dateToCoreData(semester.start!);
  const semesterEnd = dateToCoreData(semester.end!);
  await db.execute("INSERT INTO ZSEMESTER (Z_ENT, ZTYPEID, ZYEAR, ZEND, ZSTART) VALUES ($1, $2, $3, $4, $5)", [
    5,
    semester.type,
    schoolYearId,
    semesterEnd,
    semesterStart,
  ]);
}
