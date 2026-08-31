import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Subject } from "@/components/subjects/Subject";
import type { SubjectEntity } from "@/components/subjects/SubjectEntity";
import { db, nextPrimaryKey, withTransaction, type CountResult } from "@/store/Database";
import { Z_ENT } from "@/store/EntityId";

export async function loadSubjectsBySchoolYear(schoolYear: SchoolYear): Promise<Subject[]> {
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

export async function createSubjectForSchoolYear(subject: Subject, schoolYear: SchoolYear): Promise<void> {
  await withTransaction(async () => {
    const id = await nextPrimaryKey(Z_ENT.ZSUBJECT);
    const result = await db.execute(
      `
      INSERT OR IGNORE INTO ZSUBJECT (Z_PK, Z_ENT, Z_OPT, ZNAME)
      VALUES ($1, $2, $3, $4)
      `,
      [id, Z_ENT.ZSUBJECT, 1, subject.name],
    );

    let subjectId: number;
    if (result.rowsAffected > 0) {
      subjectId = id;
    } else {
      const existing: SubjectEntity[] = await db.select(`SELECT Z_PK FROM ZSUBJECT WHERE ZNAME = $1`, [subject.name]);
      subjectId = existing[0].Z_PK;
    }

    await linkSubjectToSchoolYear(subjectId, schoolYear.id!);
  });
}

export async function linkSubjectToSchoolYear(subjectId: number, schoolYearId: number): Promise<void> {
  await db.execute(
    `
    INSERT OR IGNORE INTO Z_7YEARS (Z_7SUBJECTS, Z_8YEARS2)
    VALUES ($1, $2)
    `,
    [subjectId, schoolYearId],
  );
}

export async function deleteSubjectFromSchoolYear(subject: Subject, schoolYear: SchoolYear): Promise<void> {
  await withTransaction(async () => {
    await db.execute(
      `
      DELETE FROM Z_7YEARS
      WHERE Z_7SUBJECTS = $1
      AND Z_8YEARS2 = $2
      `,
      [subject.id, schoolYear.id],
    );
    const count: CountResult[] = await db.select(`SELECT COUNT(*) FROM Z_7YEARS WHERE Z_7SUBJECTS = $1`, [subject.id]);
    if (count[0]["COUNT(*)"] === 0) {
      await db.execute(`DELETE FROM ZSUBJECT WHERE Z_PK = $1`, [subject.id]);
    }
  });
}

export async function updateSubject(subject: Subject): Promise<void> {
  await db.execute(
    `
    UPDATE ZSUBJECT
    SET ZNAME = $1, Z_OPT = Z_OPT + 1
    WHERE Z_PK = $2
    `,
    [subject.name, subject.id],
  );
}

export async function loadAll(): Promise<Subject[]> {
  const subjects: SubjectEntity[] = await db.select(`SELECT * FROM ZSUBJECT`);
  return subjects.map((subject) => {
    return {
      id: subject.Z_PK,
      name: subject.ZNAME,
    };
  });
}
