import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Subject } from "@/components/subjects/Subject";
import { createSubjectForSchoolYear } from "@/components/subjects/SubjectGateway";

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

describe("createSubjectForSchoolYear", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a new subject and mapping when the subject does not exist yet", async () => {
    mockedSelect.mockResolvedValueOnce([]);          // no existing subject
    mockedNextPrimaryKey.mockResolvedValueOnce(42);

    const subject: Subject = { id: undefined, name: "Deutsch" };
    await createSubjectForSchoolYear(subject, schoolYear);

    expect(mockedNextPrimaryKey).toHaveBeenCalledWith("Subject");
    expect(mockedExecute).toHaveBeenCalledTimes(2);
    expect(mockedExecute).toHaveBeenNthCalledWith(
      1,
      "INSERT INTO ZSUBJECT (Z_PK, Z_ENT, ZNAME) VALUES ($1, $2, $3)",
      [42, 7, "Deutsch"],
    );
    expect(mockedExecute).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO Z_7YEARS (Z_7SUBJECTS, Z_8YEARS2) VALUES ($1, $2)",
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
      "INSERT INTO Z_7YEARS (Z_7SUBJECTS, Z_8YEARS2) VALUES ($1, $2)",
      [7, 1],
    );
  });
});

