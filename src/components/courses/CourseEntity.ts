export type CourseEntity = {
  Z_PK: number;
  Z_ENT: number;
  Z_OPT: number;
  ZGROUP: number;
  ZSEMESTER: number;
  ZSUBJECT: number;
  ZYEAR: number;
  ZDAYS: object;
};

export type FullCourseEntity = CourseEntity & {
  GROUPID: number;
  GROUPNAME: string;
  SUBJECTID: number;
  SUBJECTNAME: string;
};
