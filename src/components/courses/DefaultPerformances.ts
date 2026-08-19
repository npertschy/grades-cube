import type { Student } from "@/components/students/Student";
import { db, nextPrimaryKey } from "@/store/Database";
import { dateToCoreData } from "@/store/DateConversion";
import { Z_ENT } from "@/store/EntityId";

type DefaultPerformanceDef = {
  type: number;
  title: string;
  editable: number;
  weight: (groupType: number | undefined) => number;
};

const DEFAULT_PERFORMANCE_DEFS: DefaultPerformanceDef[] = [
  { type: 0, title: "Mündliche Note",        editable: 1, weight: () => 0 },
  { type: 1, title: "Tendenz",               editable: 0, weight: () => 0 },
  { type: 2, title: "Gesamtnote Mündlich",   editable: 1, weight: () => 0.7 },
  { type: 3, title: "Sonstige Note",          editable: 1, weight: () => 0 },
  { type: 4, title: "Gesamtnote Sonstige",   editable: 0, weight: () => 0.3 },
  { type: 5, title: "Gesamtnote AT",          editable: 0, weight: (gt) => gt === 2 ? 0.5 : 0.7 },
  { type: 6, title: "Klausurnote",            editable: 1, weight: () => 0 },
  { type: 7, title: "Gesamtnote Klausuren",  editable: 0, weight: (gt) => gt === 2 ? 0.5 : 0.3 },
  { type: 8, title: "Endnote",               editable: 0, weight: () => 0 },
];

/**
 * Inserts the 9 default ZPERFORMANCE rows for a newly created course and
 * blank ZGRADE rows for any already-enrolled students.
 *
 * Must be called inside an already-open EXCLUSIVE TRANSACTION — this function
 * does not manage the transaction boundary itself.
 *
 * Weights for types 5 and 7 depend on groupType (1 = Sek I, 2 = Sek II).
 */
export async function insertDefaultPerformancesWithGrades(
  courseId: number,
  groupType: number | undefined,
  students: Student[],
): Promise<void> {
  const now = dateToCoreData(new Date());
  for (const def of DEFAULT_PERFORMANCE_DEFS) {
    const performanceId = await nextPrimaryKey("Performance");
    await db.execute(
      `INSERT INTO ZPERFORMANCE (Z_PK, Z_ENT, Z_OPT, ZEDITABLE, ZSORTORDER, ZTYPE, ZCOURSE, ZDATE, ZWEIGHT, ZTITLE)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        performanceId,
        Z_ENT.ZPERFORMANCE,
        1,
        def.editable,
        0,
        def.type,
        courseId,
        now,
        def.weight(groupType),
        def.title,
      ],
    );
    for (const student of students) {
      const gradeId = await nextPrimaryKey("Grade");
      await db.execute(
        `INSERT INTO ZGRADE (Z_PK, Z_ENT, Z_OPT, ZPERFORMANCE, ZSTUDENT)
         VALUES ($1, $2, $3, $4, $5)`,
        [gradeId, Z_ENT.ZGRADE, 1, performanceId, student.id],
      );
    }
  }
}
