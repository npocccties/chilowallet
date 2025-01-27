import { z } from "zod";

import type { NextApiRequest, NextApiResponse } from "next";

import { errors } from "@/constants/error";
import { logEndForApi, logStartForApi, logStatus } from "@/constants/log";
import { loggerDebug, loggerError, loggerInfo } from "@/lib/logger";
import { getUserInfoFormJwt } from "@/lib/userInfo";
import { findAllLmsList } from "@/server/repository/lmsList";
import { api } from "@/share/api";
import { ErrorResponse } from "@/types/api/error";
import { LmsListResponse } from "@/types/api/lms";

const apiPath = api.v1.lms.list;

async function handler(req: NextApiRequest, res: NextApiResponse<LmsListResponse | ErrorResponse>) {
  loggerInfo(logStartForApi(apiPath));

  const session_cookie = req.cookies.session_cookie;
  const { eppn } = getUserInfoFormJwt(session_cookie);

  if (!eppn) {
    return res.status(401).json({ error: { errorMessage: errors.unAuthrizedError.detail.noSession } });
  }

  try {
    const lmsList = await findAllLmsList();

    loggerDebug("findAllLmsList", lmsList);
    loggerInfo(`${logStatus.success} ${apiPath}`);

    return res.status(200).json({ lmsList: lmsList});
  } catch (e) {
    loggerError(`${logStatus.error} ${apiPath}`, e.message);

    return res.status(500).json({ error: { errorMessage: e.message, detail: e } });
  } finally {
    loggerInfo(logEndForApi(apiPath));
  }
}

export default handler;
