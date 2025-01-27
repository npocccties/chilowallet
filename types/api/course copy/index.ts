import { IfCourseInfo } from "@/types/BadgeInfo";

export type CourseListReqestParam = {
  lmsId: number;
  username?: string;
  password?: string;
};

export type CourseListResponse = {
  courseList: CourseList;
  loginError?: string;
};

type CourseList = IfCourseInfo[];
