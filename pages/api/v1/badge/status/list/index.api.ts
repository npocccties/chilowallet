
import type { NextApiRequest, NextApiResponse } from "next";

import { errors } from "@/constants/error";
import { logEndForApi, logStartForApi, logStatus } from "@/constants/log";
import { convertUNIXorISOstrToJST, convertUTCtoJSTstr } from "@/lib/date";
import { loggerDebug, loggerError, loggerInfo, loggerWarn } from "@/lib/logger";
import { getUserInfoFormJwt } from "@/lib/userInfo";
import { credentialDetail } from "@/server/repository/credentialDetail";
import { findAllLmsList } from "@/server/repository/lmsList";
import { getVcBadge } from "@/server/services/badgeList.service";
import { getCourseListFromMoodle } from "@/server/services/courseList.service";
import { getBadgeJson, myBadgesList, myOpenBadge } from "@/server/services/lmsAccess.service";
import { getWalletId } from "@/server/services/wallet.service";
import { api } from "@/share/api";
import { BadgeStatusListResponse } from "@/types/api/badge";
import { ErrorResponse } from "@/types/api/error";
import { IfBadgeInfo, IfCourseInfo, IfUserBadgeStatus } from "@/types/BadgeInfo";
import { BadgeMetaData } from "@/types/badgeInfo/metaData";

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
    const host = req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "http"; // HTTP or HTTPS
    const fqdn = `${protocol}://${host}`;
    let response: BadgeStatusListResponse = { user_badgestatuslist: { lms_badge_count: 0, lms_badge_list: [], badge_detail_base_url: `${fqdn}/credential/detail`, error_code: ""}};
    try {
      walletId = await getWalletId(eppn);
    } catch (e) {
      loggerError(`${errors.E20003}: Not found wallet. eppn: ${eppn}`);
      response.user_badgestatuslist.error_code = errors.E20003;
      return res.status(200).json(response);
    }
    loggerDebug(`walletId: ${walletId}`);
    const lmsList = await findAllLmsList();
    loggerDebug(`lmsList: ${JSON.stringify(lmsList)}`);

    let errorCodes: string[] = [];
    let lms_badge_list: IfUserBadgeStatus[] = [];
    for (const lms of lmsList) {
      if (!lms.ssoEnabled) {
        continue;
      }
      const lmsId = lms.lmsId;
      const lmsUrl = lms.lmsUrl;
      loggerDebug(`lms: ${JSON.stringify(lms)}`);
      var courseList: IfCourseInfo[] = [];
      try {
        courseList = await getCourseListFromMoodle({ walletId, username: eppn, lmsId });
      } catch (e) {
        if (e.message.indexOf("getUserByUsername") != -1) {
          errorCodes.push(errors.E10000);
        } else if (e.message.indexOf("getMyCourses") != -1) {
          errorCodes.push(errors.E10001);
        } else {
          errorCodes.push(errors.E29999);
        }
        loggerWarn(`${errorCodes.at(-1)}: $Failed to getCourseListFromMoodle. eppn: ${eppn} lmsUrl: ${lmsUrl}`);
        continue;
      }
      let badgeList: IfBadgeInfo[];
      try {
        badgeList = await myBadgesList(eppn, "", lms);
      } catch (e) {
        loggerWarn(`${errors.E10002}: Failed to retrieve the badge list from the LMS. eppn: ${eppn} lmsUrl: ${lmsUrl}`);
        errorCodes.push(errors.E10002);
        continue;
      }
      for (const badge of badgeList) {
        const uniquehash = badge.uniquehash;
        let badgeClassId = "";
        let badgeMetaData: BadgeMetaData = undefined;
        let badgeJson: any = undefined;
        try {
          badgeMetaData = await myOpenBadge(uniquehash, lmsUrl);
          loggerDebug(`badgeMetaData.id: ${badgeMetaData.id} badgeMetaData.badge.id: ${badgeMetaData.badge.id}, badgeMetaData: ${badgeMetaData?.toString() ?? null}`);
          badgeClassId = badgeMetaData.badge.id;
          badgeJson = await getBadgeJson(badgeClassId);
        } catch (e) {
          loggerWarn(`${errors.E20001}: Failed to retrieve badge metadata from the LMS. uniquehash: ${uniquehash} lmsUrl: ${lmsUrl}`);
          errorCodes.push(errors.E20001);
        }
        let courseId = "";
        let alignmentsTargeturl = "";
        try {
          for (const url of badgeJson.alignments as string[]) {
            if (url.indexOf('course/view.php') != -1) {
              alignmentsTargeturl = url;
              break;
            }
          }
          const alignments_targeturl = new URL(alignmentsTargeturl);
          courseId = alignments_targeturl.searchParams.get("id");
        } catch (e) {
          loggerWarn(`${errors.E20001}: Invalid url. alignments_targeturl: ${alignmentsTargeturl} lmsUrl: ${lmsUrl}`);
          errorCodes.push(errors.E20001);
        }
        const course = courseList.find(o => o.id.toString() == courseId);
        if (course) {
          loggerDebug(`alignments_targeturl: ${alignmentsTargeturl} courseId: ${courseId} course: ${JSON.stringify(course)}`);
          if (alignmentsTargeturl.indexOf(lmsUrl) == -1 || alignmentsTargeturl.indexOf(course.id.toString()) == -1) {
            loggerWarn(`${errors.E20001}: There is no badge information matching the course id[${course.id}] in the portal DB. lmsUrl: ${lmsUrl}`);
            errorCodes.push(errors.E20001);
          }
        } else {
          loggerWarn(`${errors.E20001}: Not found course. alignments_targeturl: ${alignmentsTargeturl} courseId: ${courseId}`);
          errorCodes.push(errors.E20001);
        }
        loggerDebug(`badgeClassId: ${badgeClassId}`);
        const lmsId = lms.lmsId;
        let submitted = false;
        const vcBadge = await getVcBadge(badgeClassId, walletId, lmsId);
        loggerDebug(`badgeClassId: ${badgeClassId} vcBadge: ${JSON.stringify(vcBadge)} lmsUrl: ${lmsUrl}`);
        if (vcBadge) {
          const submittedBadge = await credentialDetail({ badgeVcId: vcBadge.badgeVcId, walletId: walletId });
          if (submittedBadge) {
            submitted = submittedBadge.submissions != null;
          }
        }
        let issued = badgeJson != undefined;
        let issued_at = undefined;
        if (issued) {
          issued_at = convertUNIXorISOstrToJST(badge.dateissued)
        }
        response.user_badgestatuslist.lms_badge_count++;
        lms_badge_list.push({
          enrolled: course != undefined,//コース有無
          issued: issued,//バッジ有無
          imported: vcBadge != undefined,
          submitted: submitted,
          enrolled_at: convertUNIXorISOstrToJST(course?.startdate),
          issued_at: issued_at,//issuedにひきずられる
          imported_at: convertUTCtoJSTstr(vcBadge?.createdAt),
          badge_expired_at: badgeMetaData?.expires?.toString() ?? null,
          badge_vc_id: vcBadge?.badgeVcId ?? null,
          lms_id: lmsId,
          lms_name: lms.lmsName,
          lms_url: lms.lmsUrl,
          course_id: course?.id,
          course_name: course?.fullname,
          course_description: course?.summary,
          badge_json: badgeJson?.toString() ?? null,
        });
      }
    }
    if (errorCodes.length != 0) {
      response.user_badgestatuslist.error_code = errorCodes.at(0);
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
