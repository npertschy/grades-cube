import { describe, expect, it } from "vitest";
import { coreDataToUnix, dateToCoreData } from "@/store/DateConversion";

// CoreData epoch starts 2001-01-01T00:00:00Z = Unix 978307200s
const COREDATA_EPOCH_UNIX = 978307200;

describe("coreDataToUnix", () => {
  it("converts 0 to the CoreData epoch (2001-01-01)", () => {
    const result = coreDataToUnix(0);
    expect(result.getTime()).toBe(COREDATA_EPOCH_UNIX * 1000);
  });

  it("converts a positive offset correctly", () => {
    const result = coreDataToUnix(86400); // +1 day
    expect(result.getTime()).toBe((COREDATA_EPOCH_UNIX + 86400) * 1000);
  });

  it("converts a negative offset correctly", () => {
    const result = coreDataToUnix(-86400); // -1 day from CoreData epoch
    expect(result.getTime()).toBe((COREDATA_EPOCH_UNIX - 86400) * 1000);
  });
});

describe("dateToCoreData", () => {
  it("converts the CoreData epoch date to 0", () => {
    const date = new Date(COREDATA_EPOCH_UNIX * 1000);
    expect(dateToCoreData(date)).toBe(0);
  });

  it("converts a date one day after the CoreData epoch to 86400", () => {
    const date = new Date((COREDATA_EPOCH_UNIX + 86400) * 1000);
    expect(dateToCoreData(date)).toBe(86400);
  });

  it("truncates sub-second precision", () => {
    const date = new Date(COREDATA_EPOCH_UNIX * 1000 + 999);
    expect(dateToCoreData(date)).toBe(0);
  });
});

describe("round-trip", () => {
  it("coreDataToUnix → dateToCoreData returns the original value", () => {
    const original = 12345678;
    expect(dateToCoreData(coreDataToUnix(original))).toBe(original);
  });
});
