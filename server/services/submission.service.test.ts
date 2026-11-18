import axios from "axios";

import { findConsumerAndBadgeVc } from "@/server/repository/submissionBadge";
import { sendCabinetForVc } from "@/server/services/submission.service";

jest.mock("axios");
jest.mock("@/server/repository/badgeConsumer", () => ({ findCabinetUrl: jest.fn() }));
jest.mock("@/server/repository/submissionBadge", () => ({
  createSubmission: jest.fn(),
  findConsumerAndBadgeVc: jest.fn(),
}));
jest.mock("@/configs/retry", () => ({
  badgeCabinetRetryConfig: { count: 1, time: 0 },
  smtpMailRetryConfig: { count: 1, time: 0 },
}));

const mockPost = axios.post as jest.MockedFunction<typeof axios.post>;
const mockFind = findConsumerAndBadgeVc as jest.MockedFunction<typeof findConsumerAndBadgeVc>;

const params = {
  badgeVcId: 1,
  consumerId: 2,
  walletId: 3,
  email: "learner@example.com",
  externalLinkageId: "user-1",
};

const cabinetRejects = (reason_code: number, reason_msg: string) =>
  mockPost.mockRejectedValue({ response: { status: 400, data: { reason_code, reason_msg } }, message: "Bad Request" });

describe("sendCabinetForVc", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockFind.mockResolvedValue({
      consumer: { cabinetUrl: "https://cabinet.example.org", consumerName: "Example" },
      badgeVc: { vcDataHeader: "{}", vcDataPayload: "{}", vcDataSignature: "sig" },
    } as any);
  });

  test("キャビネットの検証サービスが一時的に使えなければ verification unavailable", async () => {
    cabinetRejects(102, "OpenBadge verification temporarily unavailable");

    await expect(sendCabinetForVc(params)).resolves.toEqual({
      reason_msg: "verification unavailable",
      reason_code: 102,
    });
  });

  test("検証サービスが未設定の場合も verification unavailable", async () => {
    cabinetRejects(102, "OpenBadge verification temporarily unavailable: verifier is not configured");

    await expect(sendCabinetForVc(params)).resolves.toEqual({
      reason_msg: "verification unavailable",
      reason_code: 102,
    });
  });

  test("バッジ自体が不正なら verification failure", async () => {
    cabinetRejects(102, "OpenBadge verification failed");

    await expect(sendCabinetForVc(params)).resolves.toEqual({
      reason_msg: "verification failure",
      reason_code: 102,
    });
  });

  test("VC の検証に失敗したら verification failure", async () => {
    cabinetRejects(103, "OpenBadge verification temporarily unavailable");

    await expect(sendCabinetForVc(params)).resolves.toEqual({
      reason_msg: "verification failure",
      reason_code: 103,
    });
  });
});
