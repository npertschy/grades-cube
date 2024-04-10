import type { Subject } from "@/components/subjects/Subject";
import type { SubjectEntity } from "@/components/subjects/SubjectEntity";
import { db } from "@/store/Database";

async function loadAllSubjects(): Promise<Subject[]> {
  const subjects: SubjectEntity[] = await db.select("SELECT * from ZSUBJECT");

  return subjects.map((subject) => {
    return {
      id: subject.Z_PK,
      name: subject.ZNAME,
    };
  });
}

async function createSubject(subject: Subject) {
  await db.execute("INSERT INTO ZSUBJECT (Z_ENT, ZNAME) VALUES ($1, $2)", [
    7,
    subject.name,
  ]);
}

async function deleteSubject(subject: Subject) {
  await db.execute("DELETE FROM ZSUBJECT WHERE Z_PK = $1", [subject.id]);
}

async function updateSubject(subject: Subject) {
  await db.execute("UPDATE ZSUBJECT SET ZNAME = $1 WHERE Z_PK = $2", [
    subject.name,
    subject.id,
  ]);
}

export function useSubjectGateway() {
  return {
    loadAllSubjects,
    createSubject,
    deleteSubject,
    updateSubject,
  };
}
