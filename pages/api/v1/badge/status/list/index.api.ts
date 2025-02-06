
import type { NextApiRequest, NextApiResponse } from "next";

import { errors } from "@/constants/error";
import { logEndForApi, logStartForApi, logStatus } from "@/constants/log";
import { convertUNIXorISOstrToJST, convertUTCtoJSTstr } from "@/lib/date";
import { loggerDebug, loggerError, loggerInfo } from "@/lib/logger";
import { getUserInfoFormJwt } from "@/lib/userInfo";
import { findAllLmsList } from "@/server/repository/lmsList";
import { getVcBadgeCreateDate } from "@/server/services/badgeList.service";
import { getCourseListFromMoodle } from "@/server/services/courseList.service";
import { myBadgesList, myOpenBadge } from "@/server/services/lmsAccess.service";
import { getPortalWisdomBadgeIds, getPortalWisdomBadges } from "@/server/services/portal.service";
import { getWalletId } from "@/server/services/wallet.service";
import { api } from "@/share/api";
import { BadgeStatusListResponse } from "@/types/api/badge";
import { ErrorResponse } from "@/types/api/error";
import { IfBadgeInfo, IfCourseInfo } from "@/types/BadgeInfo";

const apiPath = api.v1.badge.status_list;


async function handler(req: NextApiRequest, res: NextApiResponse<BadgeStatusListResponse | ErrorResponse>) {
  loggerInfo(logStartForApi(apiPath));

  const session_cookie = req.cookies.session_cookie;
  const { eppn } = getUserInfoFormJwt(session_cookie);

  if (!eppn) {
    return res.status(401).json({ error: { errorMessage: errors.unAuthrizedError.detail.noSession } });
  }

  try {
    const walletId = await getWalletId(eppn);
    const lmsList = await findAllLmsList();
    var response: BadgeStatusListResponse = { user_badgestatuslist: { lms_badge_count: 0, lms_badge_list: [], error_code: ""}};
    const badgeIds = await getPortalWisdomBadgeIds();
    if (badgeIds.length == 0) {
      loggerError(`badgesIds is empty.`);
      response.user_badgestatuslist.error_code = errors.E30000;
      return res.status(200).json(response);
    }
    const portalWidomBadges = await getPortalWisdomBadges(badgeIds);
    if (portalWidomBadges.length == 0) {
      loggerError(`portalWidomBadges is empty.`);
      response.user_badgestatuslist.error_code = errors.E30000;
      return res.status(200).json(response);
    }
    for (const lms of lmsList) {
      const lmsId = lms.lmsId;
      loggerDebug(`lms: ${JSON.stringify(lms)}`);
      var courseList: IfCourseInfo[] = [];
      try {
        courseList = await getCourseListFromMoodle({ walletId, username: eppn, lmsId });
      } catch (e) {
        if (e.message.indexOf("getUserByUsername") != -1) {
          response.user_badgestatuslist.error_code = errors.E10000;
        } else if (e.message.indexOf("myCoursesList") != -1) {
          response.user_badgestatuslist.error_code = errors.E10001;
        } else {
          response.user_badgestatuslist.error_code = errors.E29999;
        }
        return res.status(200).json(response);
      }
      const lmsUrl = lms.lmsUrl;
      var lmsBadgeMap = new Map<string, IfBadgeInfo>();
      var badgeList: IfBadgeInfo[];
      try {
        badgeList = await myBadgesList(eppn, "", lms);
      } catch (e) {
        loggerError(`Failed to retrieve the badge list from the LMS. eppn: ${eppn}`);
        response.user_badgestatuslist.error_code = errors.E10002;
        return res.status(200).json(response);
      }
      for (const badge of badgeList) {
        const uniquehash = badge.uniquehash;
        try {
          const badgeMetaData = await myOpenBadge(uniquehash, lmsUrl);
          loggerDebug(`badgeMetaData: ${JSON.stringify(badgeMetaData)}`);
          const badgeClassId = badgeMetaData.id;
          lmsBadgeMap.set(badgeClassId, badge);
        } catch (e) {
          loggerError(`Failed to retrieve badge metadata from the LMS. uniquehash: ${uniquehash} lmsUrl: ${lmsUrl}`);
          response.user_badgestatuslist.error_code = errors.E20001;
          return res.status(200).json(response);
        }
      }
      for (const course of courseList) {
        const targetPortalBadges = portalWidomBadges.filter(o => o.alignments_targeturl.indexOf(lmsUrl) != -1 && o.alignments_targeturl.indexOf(course.id.toString()) != -1)
        if (targetPortalBadges.length == 0) {
          loggerError(`There is no badge information matching the course id[${course.id}] in the portal DB. lmsUrl: ${lmsUrl}`);
          response.user_badgestatuslist.error_code = errors.E20001;
          return res.status(200).json(response);
        }
        const targetPortalBadge = targetPortalBadges[0];
        const badgeClassId = targetPortalBadge.digital_badge_class_id;
        if (!lmsBadgeMap.has(badgeClassId)) {
          loggerError(`There is no badge matches the badge class id[${badgeClassId}] in the LMS. lmsUrl: ${lmsUrl}`);
          response.user_badgestatuslist.error_code = errors.E20002;
          return res.status(200).json(response);
        }
        const lmsId = lms.lmsId;
        const lmsBadge = lmsBadgeMap.get(badgeClassId);
        const createDate = await getVcBadgeCreateDate(badgeClassId, lmsId);
        response.user_badgestatuslist.lms_badge_count++;
        response.user_badgestatuslist.lms_badge_list.push({
          enrolled: course.completed != 0,
          issued: lmsBadge.dateissued != 0,
          imported: createDate != null,
          enrolled_at: convertUNIXorISOstrToJST(course.startdate),
          issued_at: convertUNIXorISOstrToJST(lmsBadge.dateissued),
          imported_at: createDate != null ? convertUTCtoJSTstr(createDate) : "",
          badge_id: targetPortalBadge.badges_id,
          lms_id: lmsId,
          lms_name: lms.lmsName,
        });
      }
    }

    loggerDebug(`response: ${JSON.stringify(response)}`);
    loggerInfo(`${logStatus.success} ${apiPath}`);

    return res.status(200).json(response);
  } catch (e) {
    loggerError(`${logStatus.error} ${apiPath}`, e.message);

    return res.status(500).json({ error: { errorMessage: e.message, detail: e } });
  } finally {
    loggerInfo(logEndForApi(apiPath));
  }
}

export default handler;
