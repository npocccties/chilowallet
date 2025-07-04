import { myCoursesList } from "./lmsAccess.service";

import { loggerError } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { IfCourseInfo } from "@/types/BadgeInfo";

type Arg = {
  username: string;
  lmsId: number;
};

export const getCourseListFromMoodle = async ({
  username,
  lmsId,
}: Arg): Promise<IfCourseInfo[]> => {
  const [selectLms] = await Promise.all([
    prisma.lmsList.findUnique({
      where: {
        lmsId: lmsId,
      },
    }),
  ]);

  try {
    const courseList: IfCourseInfo[] = await myCoursesList(username, selectLms);
    return courseList;
  } catch (e) {
    loggerError("ERROR! server/services/courseList.service", e.message);
    throw e;
  }
};
