export const Z_ENT = {
  ZCOURSE: 1,
  ZGRADE: 2,
  ZGROUP: 3,
  ZPERFORMANCE: 4,
  ZSEMESTER: 5,
  ZSTUDENT: 6,
  ZSUBJECT: 7,
  ZYEAR: 8,
} as const;

export type ZEntName = keyof typeof Z_ENT;

export type ZEntId = (typeof Z_ENT)[ZEntName];
