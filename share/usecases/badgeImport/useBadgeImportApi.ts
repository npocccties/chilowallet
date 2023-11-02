import { api } from "../api";

import { axiosClient } from "@/lib/axios";
import { BadgeImportRequestParam } from "@/types/api/badge/index";

export const useBadgeImportApi = async (param: BadgeImportRequestParam) => {
  const apiPath = api.v1.badge.convert;
  const { uniquehash, email, badgeMetaData, lmsId, lmsName } = param;

  console.log("req", apiPath, uniquehash, email, badgeMetaData);
  const res = await axiosClient.post(apiPath, {
    uniquehash,
    email,
    badgeMetaData,
    lmsId,
    lmsName,
  });

  return res;
};
