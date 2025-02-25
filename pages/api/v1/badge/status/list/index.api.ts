
import type { NextApiRequest, NextApiResponse } from "next";

import { errors } from "@/constants/error";
import { logEndForApi, logStartForApi, logStatus } from "@/constants/log";
import { convertUNIXorISOstrToJST, convertUTCtoJSTstr } from "@/lib/date";
import { loggerDebug, loggerError, loggerInfo, loggerWarn } from "@/lib/logger";
import { getUserInfoFormJwt } from "@/lib/userInfo";
import { findAllLmsList } from "@/server/repository/lmsList";
import { submissionBadge } from "@/server/repository/submissionBadge";
import { getVcBadge } from "@/server/services/badgeList.service";
import { getCourseListFromMoodle } from "@/server/services/courseList.service";
import { myBadgesList, myOpenBadge } from "@/server/services/lmsAccess.service";
import { getPortalWisdomBadgeIds, getPortalWisdomBadges } from "@/server/services/portal.service";
import { getWalletId } from "@/server/services/wallet.service";
import { api } from "@/share/api";
import { BadgeStatusListResponse } from "@/types/api/badge";
import { ErrorResponse } from "@/types/api/error";
import { IfBadgeInfo, IfCourseInfo, IfUserBadgeStatus } from "@/types/BadgeInfo";

const apiPath = api.v1.badge.status_list;


async function handler(req: NextApiRequest, res: NextApiResponse<BadgeStatusListResponse | ErrorResponse>) {
  loggerInfo(logStartForApi(apiPath));

  const session_cookie = req.cookies.session_cookie;
  const { eppn } = getUserInfoFormJwt(session_cookie);
  loggerDebug(`eppn: ${eppn}`);

  if (!eppn) {
    return res.status(401).json({ error: { errorMessage: errors.unAuthrizedError.detail.noSession } });
  }

  try {
    var walletId = 0;
    try {
      walletId = await getWalletId(eppn);
    } catch (e) {
      loggerError(`Not found wallet. eppn: ${eppn}`);
      response.user_badgestatuslist.error_code = errors.E20003;
      return res.status(200).json(response);
    }
    loggerDebug(`walletId: ${walletId}`);
    const lmsList = await findAllLmsList();
    loggerDebug(`lmsList: ${JSON.stringify(lmsList)}`);
    const host = req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "http"; // HTTP or HTTPS
    const fqdn = `${protocol}://${host}`;
    var response: BadgeStatusListResponse = { user_badgestatuslist: { lms_badge_count: 0, lms_badge_list: [], badge_detail_base_url: `${fqdn}/credential/detail`, error_code: ""}};
    const badgeIds = await getPortalWisdomBadgeIds();
    loggerDebug(`badgeIds: ${JSON.stringify(badgeIds)}`);
    if (badgeIds.length == 0) {
      loggerError(`badgesIds is empty.`);
      response.user_badgestatuslist.error_code = errors.E30000;
      return res.status(200).json(response);
    }
    const portalBadges = await getPortalWisdomBadges(badgeIds);
    if (portalBadges.length == 0) {
      loggerError(`portalWidomBadges is empty.`);
      response.user_badgestatuslist.error_code = errors.E30000;
      return res.status(200).json(response);
    }
    for (const lms of lmsList) {
      if (!lms.ssoEnabled) {
        continue;
      }
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
          loggerDebug(`badgeMetaData.id: ${badgeMetaData.id} badgeMetaData.badge.id: ${badgeMetaData.badge.id}`);
          const badgeClassId = badgeMetaData.badge.id;
          lmsBadgeMap.set(badgeClassId, badge);
        } catch (e) {
          loggerError(`Failed to retrieve badge metadata from the LMS. uniquehash: ${uniquehash} lmsUrl: ${lmsUrl}`);
          response.user_badgestatuslist.error_code = errors.E20001;
          return res.status(200).json(response);
        }
      }
      var lms_badge_list: IfUserBadgeStatus[] = [];
      for (const portalBadge of portalBadges) {
        loggerDebug(`portalBadge.badges_id: ${portalBadge.badges_id} lmsId: ${lms.lmsId}`);
        var existBadge = lms_badge_list.find(o => o.badge_id == portalBadge.badges_id && o.lms_id == lms.lmsId);
        if (existBadge) {
          loggerWarn(`Duplicate portal badge: badgeId: ${portalBadge.badges_id} lmsUrl: ${lmsUrl}`);
          continue;
        }
        var courseId = "";
        try {
          const alignments_targeturl = new URL(portalBadge.alignments_targeturl);
          courseId = alignments_targeturl.searchParams.get("id");
        } catch (e) {
          loggerWarn(`Invalid url. alignments_targeturl: ${portalBadge.alignments_targeturl} lmsUrl: ${lmsUrl}`);
          continue;
        }
        const course = courseList.find(o => o.id.toString() == courseId);
        if (!course) {
          loggerWarn(`Not found course. alignments_targeturl: ${portalBadge.alignments_targeturl} courseId: ${courseId}`);
          continue;
        }
        loggerDebug(`alignments_targeturl: ${portalBadge.alignments_targeturl} courseId: ${courseId} course: ${JSON.stringify(course)}`);
        if (portalBadge.alignments_targeturl.indexOf(lmsUrl) == -1 || portalBadge.alignments_targeturl.indexOf(course.id.toString()) == -1) {
          loggerError(`There is no badge information matching the course id[${course.id}] in the portal DB. lmsUrl: ${lmsUrl}`);
          response.user_badgestatuslist.error_code = errors.E20001;
          return res.status(200).json(response);
        }
        const badgeClassId = portalBadge.digital_badge_class_id;
        loggerDebug(`badgeClassId: ${badgeClassId}`);
        if (!lmsBadgeMap.has(badgeClassId)) {
          loggerError(`There is no badge matches the badge class id[${badgeClassId}] in the LMS. lmsUrl: ${lmsUrl} lmsBadgeMap.keys: ${[...lmsBadgeMap.keys()]}`);
          response.user_badgestatuslist.error_code = errors.E20002;
          return res.status(200).json(response);
        }
        const lmsId = lms.lmsId;
        const lmsBadge = lmsBadgeMap.get(badgeClassId);
        var submission = false;
        const vcBadge = await getVcBadge(badgeClassId, lmsId);
        loggerDebug(`badgeClassId: ${badgeClassId} vcBadge: ${JSON.stringify(vcBadge)} lmsUrl: ${lmsUrl}`);
        if (vcBadge) {
          const submissioned = await submissionBadge({ badgeVcId: vcBadge.badgeVcId });
          if (submissioned) {
            submission = submissioned.badgeVc != null;
          }
        }
        response.user_badgestatuslist.lms_badge_count++;
        lms_badge_list.push({
          enrolled: course.completed != 0 || false,
          issued: lmsBadge.dateissued != 0,
          imported: vcBadge != null || false,
          submission: submission,
          enrolled_at: convertUNIXorISOstrToJST(course?.startdate),
          issued_at: convertUNIXorISOstrToJST(lmsBadge.dateissued),
          imported_at: convertUTCtoJSTstr(vcBadge?.createdAt),
          badge_expired_at: convertUNIXorISOstrToJST(course.dateexpire),
          badge_id: portalBadge.badges_id,
          badge_vc_id: vcBadge != null ? vcBadge.badgeVcId : null,
          lms_id: lmsId,
          lms_name: lms.lmsName,
        });
      }
    }
    response.user_badgestatuslist.lms_badge_list = lms_badge_list;
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
