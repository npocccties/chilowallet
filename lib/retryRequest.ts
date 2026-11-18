import { loggerWarn } from "./logger";

import { RetryConfig } from "@/types/config";

const wait = (delay: number) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * リトライ処理を実装するための共通関数。Promiseをラップして使用します。
 * @param operation 実行する非同期関数（axiosでのリクエストを想定）
 * @param config リトライ時の設定（リトライ回数、リトライ時間）
 * @returns
 */
export const retryRequest = async (operation: () => Promise<any>, config: RetryConfig) => {
  for (let i = 0; i < config.count; i++) {
    try {
      const res = await operation();
      return res;
    } catch (exp) {
      loggerWarn(`error retryRequest exp: ${exp}`);
      // 4xx台のステータスコードが返却された場合はリトライしない
      if (exp.response?.status >= 400 && exp.response?.status <= 499) {
        throw exp;
      }

      if (i < config.count - 1) {
        loggerWarn(`Retry attempt ${i + 1}: ${exp.message}, Retry Time: ${config.time} ms`);
        await wait(config.time);
        continue;
      } else {
        throw exp;
      }
    }
  }
};

/**
 * openbadge検証時にリトライ処理を実装するための関数。
 * operation の結果が shouldRetry を満たす間だけ（一時的に検証できない場合のみ）リトライし、
 * バッジが正当に無効だった場合などはリトライせずにそのまま結果を返します。
 * @param operation 実行する非同期関数（例外を投げずに結果を返すことを想定）
 * @param shouldRetry 結果を受け取り、リトライすべきなら true を返す関数
 * @param config リトライ時の設定（リトライ回数、リトライ時間）
 * @returns 最後に実行した operation の結果
 */
export const retryRequestForBadgeVerify = async <T>(
  operation: () => Promise<T>,
  shouldRetry: (result: T) => boolean,
  config: RetryConfig,
): Promise<T> => {
  const attempts = Number.isFinite(config.count) && config.count > 0 ? config.count : 1;
  let result: T;
  for (let i = 0; i < attempts; i++) {
    result = await operation();
    if (!shouldRetry(result) || i === attempts - 1) {
      return result;
    }
    loggerWarn(`Retry attempt ${i + 1}: badge verification is temporarily unavailable, Retry Time: ${config.time} ms`);
    await wait(config.time);
  }
  return result;
};
