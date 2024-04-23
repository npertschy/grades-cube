import type { Subject } from "@/components/subjects/Subject";
import type { SubjectEntity } from "@/components/subjects/SubjectEntity";
import { db } from "@/store/Database";

export class SubjectGateway {

  async loadAllSubjects(): Promise<Subject[]> {
    const subjects: SubjectEntity[] = await db.select("SELECT * from ZSUBJECT");

    return subjects.map((subject) => {
      return {
        id: subject.Z_PK,
        name: subject.ZNAME,
      };
    });
  }

  async createSubject(subject: Subject) {
    await db.execute("INSERT INTO ZSUBJECT (Z_ENT, ZNAME) VALUES ($1, $2)", [
      7,
      subject.name,
    ]);
  }

  async deleteSubject(subject: Subject) {
    await db.execute("DELETE FROM ZSUBJECT WHERE Z_PK = $1", [subject.id]);
  }

  async updateSubject(subject: Subject) {
    await db.execute("UPDATE ZSUBJECT SET ZNAME = $1 WHERE Z_PK = $2", [
      subject.name,
      subject.id,
    ]);
  }
}

