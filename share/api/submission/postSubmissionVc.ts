import { api } from "..";

import { axiosClient } from "@/lib/axios";
import { SubmissionVcRequestParam } from "@/types/api/submission";
import { SubmissionResponseStatus } from "@/types/status";

const apiPath = api.v1.submission.vc;
export interface PostSubmissionResponse {
  result: SubmissionResponseStatus;
  reason_code?: number;
}

export const postSubmissionVc = async (
  param: SubmissionVcRequestParam,
): Promise<PostSubmissionResponse> => {
  try {
    const res = await axiosClient.post(api.v1.submission.vc, param);
    return res.data;
  } catch (err: any) {
    return {
      result: "error",
      reason_code: err.response?.data?.reason_code,
    };
  }
};