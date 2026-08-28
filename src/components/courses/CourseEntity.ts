export type CourseEntity = {
  Z_PK: number;
  Z_ENT: number;
  Z_OPT: number;
  ZGROUP: number;
  ZSEMESTER: number;
  ZSUBJECT: number;
  ZYEAR: number;
  ZDAYS: object;
  ZLEVEL: number;
  ZORDINAL: number;
};

export type FullCourseEntity = CourseEntity & {
  GROUPID: number;
  GROUPNAME: string;
  GROUPTYPE: number;
  SUBJECTID: number;
  SUBJECTNAME: string;
};
