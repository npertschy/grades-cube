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
  it("creates a new subject with Z_OPT = 1 and year mapping when subject does not exist yet", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    mockedNextPrimaryKey.mockResolvedValueOnce(42);

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith("Subject");
    expect(mockedExecute).toHaveBeenCalledTimes(2);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO ZSUBJECT"),
      [42, 7, 1, "Deutsch"],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO Z_7YEARS"),
      [42, 1],
    );
  });

  it("only creates the year mapping when the subject already exists", async () => {
    const existing = [{ Z_PK: 7, ZNAME: "Deutsch" }];
    mockedSelect.mockResolvedValueOnce(existing);

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedNextPrimaryKey).not.toHaveBeenCalled();
    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO Z_7YEARS"),
      [7, 1],
    );
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
  it("deletes only the year mapping when the subject still belongs to other years", async () => {
    mockedExecute.mockResolvedValueOnce({});
    mockedSelect.mockResolvedValueOnce({ "COUNT(*)": 1 });

    const subject: Subject = { id: 7, name: "Deutsch" };
    await deleteSubjectFromSchoolYear(subject, schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(mockedExecute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM Z_7YEARS"),
      [7, 1],
    );
  });

  it("also deletes the subject record when no year mappings remain", async () => {
    mockedExecute.mockResolvedValue({});
    mockedSelect.mockResolvedValueOnce({ "COUNT(*)": 0 });

    const subject: Subject = { id: 7, name: "Deutsch" };
    await deleteSubjectFromSchoolYear(subject, schoolYear);

    expect(mockedExecute).toHaveBeenCalledTimes(2);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("DELETE FROM ZSUBJECT"),
      [7],
    );
  });
});
