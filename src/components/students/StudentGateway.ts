import Database, { type QueryResult } from "@tauri-apps/plugin-sql";
import { appLocalDataDir } from "@tauri-apps/api/path";
import type { Student } from "@/components/students/Student";
import type { StudentEntity } from "@/components/students/StudentEntity";

const path = (await appLocalDataDir()) + "/db/Notenwuerfel.sqlite";
const db = await Database.load("sqlite:" + path);

export async function loadAllStudents(): Promise<Student[]> {
  const students: StudentEntity[] = await db.select("SELECT * FROM ZSTUDENT");

  return students.map((student) => {
    return {
      id: student.Z_PK,
      firstName: student.ZFIRSTNAME,
      lastName: student.ZLASTNAME,
    };
  });
}
