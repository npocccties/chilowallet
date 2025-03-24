import type { NextApiRequest, NextApiResponse } from "next";

import { errors } from "@/constants/error";
import { logEndForApi, logStartForApi, logStatus } from "@/constants/log";
import { convertUNIXorISOstrToJST, convertUTCtoJSTstr } from "@/lib/date";
import { loggerDebug, loggerError, loggerInfo, loggerWarn } from "@/lib/logger";
import { getUserInfoFormJwt } from "@/lib/userInfo";
import { credentialDetail } from "@/server/repository/credentialDetail";
import { findAllLmsList } from "@/server/repository/lmsList";
import { getVcBadge, getVcBadges } from "@/server/services/badgeList.service";
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
      loggerError(`${errors.E20001}: Not found wallet. eppn: ${eppn}`);
      response.user_badgestatuslist.error_code = errors.E20001;
      return res.status(200).json(response);
    }
    loggerDebug(`walletId: ${walletId}`);
    const lmsList = await findAllLmsList();
    if (lmsList.length == 0) {
      loggerError(`${errors.E20000}: Not found lms list.`);
      response.user_badgestatuslist.error_code = errors.E20000;
      return res.status(200).json(response);
    }
    loggerDebug(`lmsList: ${JSON.stringify(lmsList)}`);

    let errorCodes: string[] = [];
    let lms_badge_list: IfUserBadgeStatus[] = [];
    let badgeClassIds = new Set<string>();
    let vadgeVcIds = new Set<number>();
    let courseIds = new Set<number>();
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
        loggerWarn(`${errorCodes[errorCodes.length - 1]}: $Failed to getCourseListFromMoodle. eppn: ${eppn} lmsUrl: ${lmsUrl}`);
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
      // ユーザに紐づいたバッジをもとに情報の収集
      loggerDebug(`1 ... Collecting information based on the badges associated with the user. lms_badge_list: ${JSON.stringify(lms_badge_list)}`);
      for (const badge of badgeList) {
        const uniquehash = badge.uniquehash;
        collectBadgesBy(walletId, uniquehash, lms.lmsId, lms.lmsName, lms.lmsUrl, errorCodes, courseList,
           response, lms_badge_list, badgeClassIds, vadgeVcIds, courseIds, badge.dateissued);
      }
      // バッジと紐づかないコースがないかコースリストをもとにチェック
      loggerDebug(`2 ... Collecting courses that are not associated with any badges. lms_badge_list: ${JSON.stringify(lms_badge_list)}`);
      for (const course of courseList) {
        if (!courseIds.has(course.id)) {
          loggerDebug(`2-1 ... Not found course[${course.id}].`);
          lms_badge_list.push({
            enrolled: true,//コース主体なのでtrue
            issued: false,//バッジと紐づいてないのでfalse
            imported: false,
            submitted: false,
            enrolled_at: convertUNIXorISOstrToJST(course?.startdate),
            issued_at: null,//issuedにひきずられる
            imported_at: null,
            badge_expired_at: null,
            badge_vc_id: null,
            lms_id: lmsId,
            lms_name: lms.lmsName,
            lms_url: lms.lmsUrl,
            course_id: course?.id,
            course_name: course?.fullname,
            course_description: course?.summary,
            badge_json: null,
          });
        }
      }
      // ウォレットにしか取り込んでないバッジがないかチェック
      loggerDebug(`3 ... Collecting badges that exist only in the wallet. lms_badge_list: ${JSON.stringify(lms_badge_list)}`);
      const vcBadges = await getVcBadges(walletId, lmsId);
      for (const vcBadge of vcBadges) {
        const badge = lms_badge_list.find(o => o?.badge_vc_id == vcBadge.badgeVcId);
        if (!badge) {
          loggerDebug(`3-1 ... Not found vcBadge[${vcBadge.badgeVcId}].`);
          const uniquehash = vcBadge.badgeUniquehash;
          collectBadgesBy(walletId, uniquehash, lms.lmsId, lms.lmsName, lms.lmsUrl, errorCodes, courseList,
             response, lms_badge_list, badgeClassIds, vadgeVcIds, courseIds, vcBadge.badgeIssuedon?.getTime() ?? undefined);
        }
      }
    }
    if (errorCodes.length != 0) {
      response.user_badgestatuslist.error_code = errorCodes.at(0);
    }
    response.user_badgestatuslist.lms_badge_count = lms_badge_list.length;
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

async function collectBadgesBy(
  walletId: number, uniquehash: string, lmsId: number, lmsName: string, lmsUrl: string, errorCodes: string[], courseList: IfCourseInfo[],
  response: BadgeStatusListResponse, lms_badge_list: IfUserBadgeStatus[], badgeClassIds: Set<string>, vadgeVcIds: Set<number>, courseIds: Set<number>, dateissued?: number) {
  let badgeClassId = "";
  let badgeMetaData: BadgeMetaData = undefined;
  let badgeJson: any = undefined;
  try {
    badgeMetaData = await myOpenBadge(uniquehash, lmsUrl);
    loggerDebug(`badgeMetaData.id: ${badgeMetaData.id} badgeMetaData.badge.id: ${badgeMetaData.badge.id}, badgeMetaData: ${badgeMetaData?.toString() ?? null}`);
    badgeClassId = badgeMetaData.badge.id;
  } catch (e) {
    loggerWarn(`${errors.E10003}: Failed to retrieve badge metadata from the LMS. uniquehash: ${uniquehash} lmsUrl: ${lmsUrl}`);
    errorCodes.push(errors.E10003);
  }
  if (badgeClassId && badgeClassIds.has(badgeClassId)) {
    loggerWarn(`Duplicate badge class id. badgeClassId: ${badgeClassId} lmsUrl: ${lmsUrl}`);
    return;
  }
  try {
    badgeJson = await getBadgeJson(badgeClassId);
    loggerDebug(`badgeJson: ${JSON.stringify(badgeJson)}`);
  } catch (e) {
    loggerWarn(`${errors.E10004}: Failed to retrieve badge json from the LMS. badgeClassId: ${badgeClassId} lmsUrl: ${lmsUrl}`);
    errorCodes.push(errors.E10004);
  }
  let courseId: number = 0;
  let alignmentsTargeturl = "";
  try {
    for (const alignment of badgeJson.alignments) {
      if (alignment.targetUrl.indexOf('course/view.php') != -1) {
        alignmentsTargeturl = alignment.targetUrl;
        const alignments_targeturl = new URL(alignmentsTargeturl);
        courseId = Number(alignments_targeturl.searchParams.get("id"));
        loggerDebug(`alignments_targeturl: ${alignmentsTargeturl} courseId: ${courseId}`);
        break;
      }
    }
  } catch (e) {
    loggerWarn(`${errors.E10005}: Invalid url. alignments_targeturl: ${alignmentsTargeturl} lmsUrl: ${lmsUrl}`);
    errorCodes.push(errors.E10005);
  }
  const course = courseList.find(o => o.id == courseId);
  if (!course) {
    loggerWarn(`${errors.E10006}: Not found course. alignments_targeturl: ${alignmentsTargeturl} courseId: ${courseId}`);
    errorCodes.push(errors.E10006);
  }
  if (courseIds.has(courseId)) {
    loggerWarn(`Duplicate course id. courseId: ${courseId} lmsUrl: ${lmsUrl}`);
    return;
  }
  courseIds.add(courseId);
  loggerDebug(`badgeClassId: ${badgeClassId}`);
  let submitted = false;
  const vcBadge = await getVcBadge(badgeClassId, walletId, lmsId);
  loggerDebug(`badgeClassId: ${badgeClassId} vcBadge: ${JSON.stringify(vcBadge)} lmsUrl: ${lmsUrl}`);
  if (vcBadge) {
    if (vadgeVcIds.has(vcBadge.badgeVcId)) {
      loggerWarn(`Duplicate badge vc id. badgeVcId: ${vcBadge.badgeVcId} lmsUrl: ${lmsUrl}`);
      return;
    }
    const submittedBadge = await credentialDetail({ badgeVcId: vcBadge.badgeVcId, walletId: walletId });
    if (submittedBadge) {
      submitted = submittedBadge.submissions != undefined;
    }
  }
  let issued = badgeJson != undefined;
  let issued_at = undefined;
  if (issued) {
    issued_at = convertUNIXorISOstrToJST(dateissued)
  }
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
    lms_name: lmsName,
    lms_url: lmsUrl,
    course_id: course?.id,
    course_name: course?.fullname,
    course_description: course?.summary,
    badge_json: JSON.stringify(badgeJson),
  });
  badgeClassIds.add(badgeClassId);
  if (vcBadge?.badgeVcId) {
    vadgeVcIds.add(vcBadge?.badgeVcId);
  }

} 

export default handler;
