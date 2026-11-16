import crypto from "crypto";
import { Readable } from "stream";

import axios from "axios";

import { moodleRetryConfig, openbadgeVerifyRetryConfig } from "@/configs/retry";
import { loggerDebug, loggerError, loggerInfo } from "@/lib/logger";
import { retryRequest, retryRequestForBadgeVerify } from "@/lib/retryRequest";
import { BadgeMetaData } from "@/types/badgeInfo/metaData";

const Through = require("stream").PassThrough;

const pngitxt = require("png-itxt");

export const getBadgeClassById = async (badgeClassId: string): Promise<any> => {
  try {
    const badgeClass = await retryRequest(() => {
      return axios.get(badgeClassId).then((res) => res.data);
    }, moodleRetryConfig);

    return badgeClass;
  } catch (err) {
    loggerError("failed to access for badge class id", err);
    throw err;
  }
};

export const setOpenBadgeMetadataToImage = async (imageString: string, assertion: any) => {
  const iTXtData = {
    type: "iTXt",
    keyword: "openbadges",
    value: JSON.stringify(assertion),
    language: "",
    translated: "",
    compressed: false,
    compression_type: 0,
  };
  return new Promise<any>(function (resolve, reject) {
    let binaryImage = Buffer.from(imageString, "base64");
    const stream = Readable.from(binaryImage);

    const chunks: Uint8Array[] = [];

    stream
      .pipe(pngitxt.set(iTXtData, true))
      .on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      })
      .on("end", () => {
        const uint8ArrayData = new Uint8Array(Buffer.concat(chunks));
        const openBadgesBase64EncodedData = Buffer.from(uint8ArrayData).toString("base64");
        resolve(openBadgesBase64EncodedData);
      })
      .on("error", (err: Error) => {
        loggerError("pngitxt Error:", err);
        reject(err);
      });
  });
};

export const extractOpenBadgeMetadataFromImage = (imageString: string) => {
  const file = Buffer.from(imageString, "base64");
  return new Promise<any>(function (resolve, reject) {
    const start = new Through();
    start.pipe(
      pngitxt.get("openbadges", function (err: any, data: any) {
        if (err) {
          reject(err);
        }
        resolve(JSON.parse(data.value));
      }),
    );
    start.write(file);
  });
};

/**
 * Open Badge の検証結果。
 * - valid: 検証に成功した
 * - invalid: バッジ自体が不正（受信者の不一致、検証NG、許可されていない取得先など）。再試行しても結果は変わらない
 * - unavailable: 検証サービスや発行元に接続できないなど、一時的な理由で検証できなかった
 */
export type OpenBadgeValidationResult =
  | { status: "valid" }
  | { status: "invalid"; reason: string }
  | { status: "unavailable"; reason: string };

type VerifierMessage = { name?: string; messageLevel?: string; result?: unknown };
type VerifierReport = { valid?: unknown; messages?: VerifierMessage[] };

// 検証サービスが発行元（Moodle 等）からの取得に一時的に失敗したことを示す文字列。
// TemporaryFetchError は fork 版の検証サービスが、接続エラー・タイムアウト・HTTP 408/429/5xx に付ける印。
// FetchNotAllowedError（取得先の許可リストに無い）は一時的な障害ではないため含めない。
const NETWORK_ERROR_PATTERN = /TemporaryFetchError|ConnectionError|Timeout|SSLError|ProxyError/;
const FETCH_NOT_ALLOWED_ERROR = "FetchNotAllowedError";
// 先行タスクの失敗に連鎖して出るメッセージ。単独ではバッジ不正の根拠にしない。
const PREREQUISITE_ERROR = "Task could not run due to unmet prerequisites.";

const isNetworkError = (m: VerifierMessage) => {
  const result = String(m.result ?? "");
  return !result.includes(FETCH_NOT_ALLOWED_ERROR) && NETWORK_ERROR_PATTERN.test(result);
};

/**
 * 検証サービスのレポートを、有効／無効／一時的に検証できない、に分類する。
 */
export const classifyVerifierReport = (report: VerifierReport | undefined): OpenBadgeValidationResult => {
  if (!report || typeof report.valid !== "boolean") {
    return { status: "unavailable", reason: "verifier returned an unexpected response" };
  }
  if (report.valid) {
    return { status: "valid" };
  }

  const errorMessages = (report.messages ?? []).filter((m) => m.messageLevel === "ERROR");
  const networkError = errorMessages.find(isNetworkError);
  // 取得の一時的な失敗以外に、バッジ自体の検証エラーがあれば invalid とする（再試行しても通らないため）。
  const hasBadgeError = errorMessages.some((m) => !isNetworkError(m) && m.result !== PREREQUISITE_ERROR);
  if (networkError && !hasBadgeError) {
    return {
      status: "unavailable",
      reason: `verifier could not fetch a badge resource: ${String(networkError.result).slice(0, 300)}`,
    };
  }

  return {
    status: "invalid",
    reason: `verifier reported ${errorMessages.length} error(s): ${errorMessages.map((m) => m.name).join(", ")}`,
  };
};

const requestVerifier = async (
  verifierUrl: string,
  openBadgeMetadata: BadgeMetaData,
): Promise<OpenBadgeValidationResult> => {
  try {
    const { data } = await axios.post(
      verifierUrl,
      {
        data: JSON.stringify(openBadgeMetadata),
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    loggerInfo(`Open Badge verification response: ${JSON.stringify(data)}`);

    return classifyVerifierReport(data?.report);
  } catch (err) {
    const status = err?.response?.status;
    // 408（タイムアウト）と 429（リクエスト過多）は一時的な状態なので、リトライ対象（unavailable）にする。
    if (status >= 400 && status <= 499 && status !== 408 && status !== 429) {
      // 検証サービスがリクエスト自体を受け付けなかった（不正な入力など）。再試行しても変わらない。
      return { status: "invalid", reason: `verifier rejected the request: HTTP ${status}` };
    }
    return { status: "unavailable", reason: `verifier request failed: ${status ? `HTTP ${status}` : err?.message}` };
  }
};

export const validateOpenBadge = async (
  email: string,
  openBadgeMetadata: BadgeMetaData,
): Promise<OpenBadgeValidationResult> => {
  const identity = openBadgeMetadata?.recipient?.identity;
  if (typeof identity !== "string") {
    return { status: "invalid", reason: "badge has no recipient identity" };
  }

  const [, expectedEmailHash] = identity.split("$");
  const salt = openBadgeMetadata.recipient.salt;
  let saltVal = salt === null || salt === undefined ? "" : salt;
  const inputEmailHash = crypto
    .createHash("sha256")
    .update(email + saltVal)
    .digest("hex");

  loggerDebug(`validateOpenBadge inputHash=${inputEmailHash} expectedhash=${expectedEmailHash}`);

  if (inputEmailHash !== expectedEmailHash) {
    return { status: "invalid", reason: "recipient email does not match" };
  }

  const verifierUrl = process.env.openbadge_verifier_url;
  if (!verifierUrl) {
    loggerError("openbadge_verifier_url is not set");
    return { status: "unavailable", reason: "openbadge_verifier_url is not set" };
  }

  return retryRequestForBadgeVerify(
    () => requestVerifier(verifierUrl, openBadgeMetadata),
    (result) => result.status === "unavailable",
    openbadgeVerifyRetryConfig,
  );
};
