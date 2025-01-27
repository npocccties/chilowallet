import { myCoursesList } from "./lmsAccess.service";

import { errors } from "@/constants/error";
import { loggerError } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { CourseListResponse } from "@/types/api/course";
import { IfCourseInfo } from "@/types/BadgeInfo";

export const getLmsList = async (): Promise<CourseListResponse> => {
  const [, selectLms] = await Promise.all([
    prisma.badgeVc.findMany({
      select: {
        badgeUniquehash: true,
      },
      where: {
        walletId: walletId,
      },
    }),
    prisma.lmsList.findUnique({
      where: {
        lmsId: lmsId,
      },
    }),
  ]);

  try {
    const courseList: IfCourseInfo[] = await myCoursesList(username, password, selectLms);
    return { courseList };
  } catch (e) {
    if (e.message === errors.moodleErrorCode.invalidLogin) {
      return { courseList: [], loginError: e.message };
    }

    loggerError("ERROR! server/services/courseList.service", e.message);
    throw e;
  }
};
