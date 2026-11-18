import crypto from "crypto";

import axios from "axios";

import { classifyVerifierReport, validateOpenBadge } from "@/server/services/openBadge.service";
import { BadgeMetaData } from "@/types/badgeInfo/metaData";

jest.mock("axios");
jest.mock("@/configs/retry", () => ({
  moodleRetryConfig: { count: 1, time: 0 },
  openbadgeVerifyRetryConfig: { count: 3, time: 0 },
}));

const mockPost = axios.post as jest.MockedFunction<typeof axios.post>;

const VERIFIER_URL = "https://verifier.example.org/results";
const EMAIL = "learner@example.com";
const SALT = "abc";

const makeBadge = (email = EMAIL): BadgeMetaData =>
  ({
    recipient: {
      type: "email",
      hashed: true,
      salt: SALT,
      identity: `sha256$${crypto.createHash("sha256").update(email + SALT).digest("hex")}`,
    },
  }) as unknown as BadgeMetaData;

const verifierResponse = (report: object) => ({ data: { report } });

const connectionErrorMessage = {
  name: "FETCH_HTTP_NODE",
  messageLevel: "ERROR",
  result: "<class 'requests.exceptions.ConnectionError'> ['requests.exceptions.ConnectionError: ...']",
};

const fetchNotAllowedMessage = {
  name: "FETCH_HTTP_NODE",
  messageLevel: "ERROR",
  result:
    "<class 'openbadges.verifier.fetch_policy.FetchNotAllowedError'> ['openbadges.verifier.fetch_policy.FetchNotAllowedError: ...']",
};

describe("classifyVerifierReport", () => {
  test("valid が true なら valid", () => {
    expect(classifyVerifierReport({ valid: true, messages: [] })).toEqual({ status: "valid" });
  });

  test("発行元に接続できないエラーなら unavailable", () => {
    expect(classifyVerifierReport({ valid: false, messages: [connectionErrorMessage] }).status).toEqual("unavailable");
  });

  test("許可されていない取得先のエラーは invalid（一時的な障害ではない）", () => {
    expect(classifyVerifierReport({ valid: false, messages: [fetchNotAllowedMessage] }).status).toEqual("invalid");
  });

  test("それ以外の検証エラーは invalid", () => {
    const report = { valid: false, messages: [{ name: "VALIDATE_PROPERTY", messageLevel: "ERROR", result: "x" }] };
    expect(classifyVerifierReport(report).status).toEqual("invalid");
  });

  test("警告だけでは unavailable にならない", () => {
    const report = {
      valid: false,
      messages: [
        { ...connectionErrorMessage, messageLevel: "WARNING" },
        { name: "VALIDATE_PROPERTY", messageLevel: "ERROR", result: "x" },
      ],
    };
    expect(classifyVerifierReport(report).status).toEqual("invalid");
  });

  test("発行元が一時的なエラー（TemporaryFetchError）を返したなら unavailable", () => {
    const report = {
      valid: false,
      messages: [
        {
          name: "FETCH_HTTP_NODE",
          messageLevel: "ERROR",
          result: "TemporaryFetchError: HTTP 503 when fetching url https://lms.example.org/badges/assertion.php",
        },
      ],
    };
    expect(classifyVerifierReport(report).status).toEqual("unavailable");
  });

  test("一時的な取得エラーに連鎖したエラーだけなら unavailable", () => {
    const report = {
      valid: false,
      messages: [
        connectionErrorMessage,
        {
          name: "VALIDATE_EXPECTED_NODE_CLASS",
          messageLevel: "ERROR",
          result: "Task could not run due to unmet prerequisites.",
        },
      ],
    };
    expect(classifyVerifierReport(report).status).toEqual("unavailable");
  });

  test("一時的な取得エラーと、バッジ自体の検証エラーが両方あれば invalid", () => {
    const report = {
      valid: false,
      messages: [connectionErrorMessage, { name: "VALIDATE_PROPERTY", messageLevel: "ERROR", result: "x" }],
    };
    expect(classifyVerifierReport(report).status).toEqual("invalid");
  });

  test("想定外のレスポンスなら unavailable", () => {
    expect(classifyVerifierReport(undefined).status).toEqual("unavailable");
    expect(classifyVerifierReport({}).status).toEqual("unavailable");
  });
});

describe("validateOpenBadge", () => {
  const originalUrl = process.env.openbadge_verifier_url;

  beforeEach(() => {
    mockPost.mockReset();
    process.env.openbadge_verifier_url = VERIFIER_URL;
  });

  afterAll(() => {
    process.env.openbadge_verifier_url = originalUrl;
  });

  test("検証サービスが valid を返せば valid、環境変数の URL に POST する", async () => {
    mockPost.mockResolvedValue(verifierResponse({ valid: true, messages: [] }));

    await expect(validateOpenBadge(EMAIL, makeBadge())).resolves.toEqual({ status: "valid" });
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toEqual(VERIFIER_URL);
  });

  test("検証サービスへの問い合わせにはタイムアウトを設定する", async () => {
    mockPost.mockResolvedValue(verifierResponse({ valid: true, messages: [] }));

    await validateOpenBadge(EMAIL, makeBadge());

    expect(mockPost.mock.calls[0][2]?.timeout).toBeGreaterThan(0);
  });

  test("検証サービスの応答がタイムアウトしたら、リトライして unavailable", async () => {
    mockPost.mockRejectedValue({ code: "ECONNABORTED", message: "timeout of 60000ms exceeded" });

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result.status).toEqual("unavailable");
    expect(mockPost).toHaveBeenCalledTimes(3);
  });

  test("受信者のメールが一致しなければ、検証サービスを呼ばずに invalid", async () => {
    const result = await validateOpenBadge("other@example.com", makeBadge());

    expect(result.status).toEqual("invalid");
    expect(mockPost).not.toHaveBeenCalled();
  });

  test("受信者情報が無ければ invalid", async () => {
    const result = await validateOpenBadge(EMAIL, {} as BadgeMetaData);

    expect(result.status).toEqual("invalid");
    expect(mockPost).not.toHaveBeenCalled();
  });

  test("バッジが正当に無効なら、リトライせずに invalid", async () => {
    mockPost.mockResolvedValue(
      verifierResponse({ valid: false, messages: [{ name: "VALIDATE_PROPERTY", messageLevel: "ERROR", result: "x" }] }),
    );

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result.status).toEqual("invalid");
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  test("許可されていない取得先なら、リトライせずに invalid", async () => {
    mockPost.mockResolvedValue(verifierResponse({ valid: false, messages: [fetchNotAllowedMessage] }));

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result.status).toEqual("invalid");
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  test("検証サービスに接続できなければ、設定回数リトライして unavailable", async () => {
    mockPost.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result.status).toEqual("unavailable");
    expect(mockPost).toHaveBeenCalledTimes(3);
  });

  test("検証サービスが 5xx を返せば、リトライして unavailable", async () => {
    mockPost.mockRejectedValue({ response: { status: 502 }, message: "Bad Gateway" });

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result.status).toEqual("unavailable");
    expect(mockPost).toHaveBeenCalledTimes(3);
  });

  test("検証サービスが 4xx を返せば、リトライせずに invalid", async () => {
    mockPost.mockRejectedValue({ response: { status: 413 }, message: "Payload Too Large" });

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result.status).toEqual("invalid");
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  test.each([408, 429])("検証サービスが %i を返せば、一時的な状態としてリトライして unavailable", async (status) => {
    mockPost.mockRejectedValue({ response: { status }, message: "temporary" });

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result.status).toEqual("unavailable");
    expect(mockPost).toHaveBeenCalledTimes(3);
  });

  test("発行元に一時的に接続できなかった後、再試行で成功すれば valid", async () => {
    mockPost
      .mockResolvedValueOnce(verifierResponse({ valid: false, messages: [connectionErrorMessage] }))
      .mockResolvedValueOnce(verifierResponse({ valid: true, messages: [] }));

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result).toEqual({ status: "valid" });
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  test("検証サービスの URL が未設定なら、呼び出さずに unavailable", async () => {
    delete process.env.openbadge_verifier_url;

    const result = await validateOpenBadge(EMAIL, makeBadge());

    expect(result.status).toEqual("unavailable");
    expect(mockPost).not.toHaveBeenCalled();
  });
});
