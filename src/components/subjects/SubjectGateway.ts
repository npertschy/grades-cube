import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Subject } from "@/components/subjects/Subject";
import type { SubjectEntity } from "@/components/subjects/SubjectEntity";
import { db, nextPrimaryKey, execute, type CountResult } from "@/store/Database";

type SubjectsToYears = {
  Z_7SUBJECTS: number
  Z_8YEARS2: number
}

export class SubjectGateway {

  // private dbClient: DbClient

  // constructor(dbClient: DbClient) {
  //   this.dbClient = dbClient;
  // }

  async loadSubjectsForSchoolYear(schoolYear: SchoolYear): Promise<Subject[]> {
    const subjectIds: SubjectsToYears[] = await db.select("SELECT Z_7SUBJECTS from Z_7YEARS WHERE Z_8YEARS2 = $1", [schoolYear.id]);
    if (subjectIds.length == 0) {
      return [];
    }

    const ids = subjectIds.map((item) => { return item.Z_7SUBJECTS });
    const orQuery = ids.map((value, index) => {
      return "Z_PK = $" + (index + 1);
    })
      .join(" OR ");

    const subjects: SubjectEntity[] = await db.select("SELECT * from ZSUBJECT WHERE " + orQuery, ids);

    return subjects.map((subject) => {
      return {
        id: subject.Z_PK,
        name: subject.ZNAME,
      };
    });
  }

  async createSubjectForSchoolYear(subject: Subject, schoolYear: SchoolYear): Promise<void> {
    const existingSubjects: SubjectEntity[] = await db.select("SELECT * from ZSUBJECT WHERE ZNAME = $1", [subject.name]);
    if (existingSubjects.length === 0) {
      console.log("Subject %s not present yet. Create new subject", subject.name);
      const id = await nextPrimaryKey("Subject");
      await execute("INSERT INTO ZSUBJECT (Z_PK, Z_ENT, ZNAME) VALUES ($1, $2, $3)", [
        id,
        7,
        subject.name,
      ]);
      await execute("INSERT INTO Z_7YEARS (Z_7SUBJECTS, Z_8YEARS2) VALUES ($1, $2)", [id, schoolYear.id]);
    } else if (existingSubjects.length === 1) {
      console.log("Subject %s already present. Only create mapping to school year", subject.name);
      const existingSubject = existingSubjects[0];
      await execute("INSERT INTO Z_7YEARS (Z_7SUBJECTS, Z_8YEARS2) VALUES ($1, $2)", [existingSubject.Z_PK, schoolYear.id])
    }

  }

  async deleteSubjectFromSchoolYear(subject: Subject, schoolYear: SchoolYear): Promise<void> {
    await db.execute("DELETE FROM Z_7YEARS WHERE Z_7SUBJECTS = $1 AND Z_8YEARS2 = $2", [subject.id, schoolYear.id]);
    const count: CountResult = await db.select("SELECT COUNT(*) FROM Z_7YEARS WHERE Z_7SUBJECTS = $1", [subject.id]);
    if (count["COUNT(*)"] === 0) {
      await db.execute("DELETE FROM ZSUBJECT WHERE Z_PK = $1", [subject.id]);
    }
  }

  async updateSubject(subject: Subject): Promise<void> {
    await db.execute("UPDATE ZSUBJECT SET ZNAME = $1 WHERE Z_PK = $2", [
      subject.name,
      subject.id,
    ]);
  }

  async loadAllSubjects(): Promise<Subject[]> {
    const subjects: SubjectEntity[] = await db.select("SELECT * FROM ZSUBJECT");
    return subjects.map((subject) => {
      return {
        id: subject.Z_PK,
        name: subject.ZNAME,
      };
    });
  }
}

