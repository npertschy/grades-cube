import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Subject } from "@/components/subjects/Subject";
import {
  createSubjectForSchoolYear,
  updateSubject,
  deleteSubjectFromSchoolYear,
} from "@/components/subjects/SubjectGateway";

const { mockedSelect, mockedExecute, mockedNextPrimaryKey } = vi.hoisted(() => ({
  mockedSelect: vi.fn(),
  mockedExecute: vi.fn(),
  mockedNextPrimaryKey: vi.fn(),
}));

vi.mock("@/store/Database", () => ({
  db: {
    select: mockedSelect,
    execute: mockedExecute,
  },
  nextPrimaryKey: mockedNextPrimaryKey,
}));

const schoolYear: SchoolYear = {
  id: 1,
  start: undefined,
  end: undefined,
  firstSemester: undefined,
  secondSemester: undefined,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createSubjectForSchoolYear", () => {
  it("inserts a new subject and creates the year link when the name is globally unique", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(42);
    mockedExecute.mockResolvedValueOnce({});  // BEGIN
    mockedExecute.mockResolvedValueOnce({ rowsAffected: 1 });  // INSERT OR IGNORE
    // link check: no existing link
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);
    mockedExecute.mockResolvedValue({});  // INSERT Z_7YEARS + COMMIT

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith("Subject");
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR IGNORE INTO ZSUBJECT"),
      [42, 7, 1, "Deutsch"],
    );
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_7YEARS"),
      [42, 1],
    );
  });

  it("uses the existing subject's Z_PK and creates the year link when the name already exists globally", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedExecute.mockResolvedValueOnce({});  // BEGIN
    mockedExecute.mockResolvedValueOnce({ rowsAffected: 0 });  // INSERT OR IGNORE — ignored
    // SELECT existing subject
    mockedSelect.mockResolvedValueOnce([{ Z_PK: 7 }]);
    // link check: no existing link for this year
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);
    mockedExecute.mockResolvedValue({});  // INSERT Z_7YEARS + COMMIT

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith("Subject");
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_7YEARS"),
      [7, 1],
    );
  });

  it("skips creating the year link when the subject is already linked to this school year", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(99);
    mockedExecute.mockResolvedValueOnce({});  // BEGIN
    mockedExecute.mockResolvedValueOnce({ rowsAffected: 0 });  // INSERT OR IGNORE — ignored
    // SELECT existing subject
    mockedSelect.mockResolvedValueOnce([{ Z_PK: 7 }]);
    // link check: link already exists
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 1 }]);
    mockedExecute.mockResolvedValue({});  // COMMIT only

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedExecute).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_7YEARS"),
      expect.anything(),
    );
  });

  it("rolls back and rethrows on error", async () => {
    mockedNextPrimaryKey.mockResolvedValueOnce(42);
    mockedExecute.mockResolvedValueOnce({});  // BEGIN
    mockedExecute.mockRejectedValueOnce(new Error("constraint violation"));
    mockedExecute.mockResolvedValue({});

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await expect(createSubjectForSchoolYear(subject, schoolYear)).rejects.toThrow("constraint violation");

    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls.some((s) => s.includes("ROLLBACK"))).toBe(true);
  });
});

describe("updateSubject", () => {
  it("updates the subject name and increments Z_OPT", async () => {
    mockedExecute.mockResolvedValueOnce({});

    const subject: Subject = { id: 7, name: "Mathematik" };
    await updateSubject(subject);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("Z_OPT = Z_OPT + 1"),
      ["Mathematik", 7],
    );
  });
});

describe("deleteSubjectFromSchoolYear", () => {
  it("deletes only the year link when the subject is still linked to other years", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 1 }]);

    const subject: Subject = { id: 7, name: "Deutsch" };
    await deleteSubjectFromSchoolYear(subject, schoolYear);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM Z_7YEARS"),
      [7, 1],
    );
    expect(mockedExecute).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZSUBJECT"),
      expect.anything(),
    );
  });

  it("also deletes the subject record when no year links remain", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce([{ "COUNT(*)": 0 }]);

    const subject: Subject = { id: 7, name: "Deutsch" };
    await deleteSubjectFromSchoolYear(subject, schoolYear);

    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM ZSUBJECT"),
      [7],
    );
    const calls = mockedExecute.mock.calls.map((c) => c[0] as string);
    expect(calls[0]).toContain("BEGIN");
    expect(calls.at(-1)).toContain("COMMIT");
  });
});
