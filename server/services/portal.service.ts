import axios from "axios";

import { msEntraRetryConfig } from "@/configs/retry";
import { loggerDebug, loggerError } from "@/lib/logger";
import { retryRequest } from "@/lib/retryRequest";
import { IfPortalBadgeDetail2, IfPortalBadgeDetail1 } from "@/types/BadgeInfo";

export const getPortalWisdomBadgeIds = async (): Promise<number[]> => {
  const requestUrl = process.env.portal_base_url + "/api/v1/badges/list/";

  loggerDebug(`getPortalWisdomBadgeIds requestUrl: ${requestUrl}`);

  let results: IfPortalBadgeDetail2[];
  try {
    results = await retryRequest(() => {
      return axios.get(requestUrl).then((res) => res.data);
    }, msEntraRetryConfig);

    loggerDebug(`getPortalWisdomBadgeIds results: ${JSON.stringify(results)}`);
  } catch (e) {
    loggerError("failed to getPortalWisdomBadgeIds", e);
    throw new Error("error", e);
  }

  return results.map(o => o.badges_id);
};

export const getPortalWisdomBadges = async (badgeIds: number[]): Promise<IfPortalBadgeDetail1[]> => {
  const requestUrl = process.env.portal_base_url + `/api/v1/badges/?badges_ids=${badgeIds.join(",")}&badges_type=wisdom`;

  loggerDebug(`getPortalWisdomBadges requestUrl: ${requestUrl}`);

  let results: IfPortalBadgeDetail1[];
  try {
    results = await retryRequest(() => {
      return axios.get(requestUrl).then((res) => res.data);
    }, msEntraRetryConfig);

    loggerDebug(`getPortalWisdomBadges results: ${JSON.stringify(results)}`);
  } catch (e) {
    loggerError("failed to getPortalWisdomBadges", e);
    throw new Error("error", e);
  }

  return results;
};
