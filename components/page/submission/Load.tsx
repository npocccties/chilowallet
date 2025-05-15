// components/page/submission/Load.tsx

import { Box, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { BadgeVcCardDetail } from "@/components/ui/card/LoadBadgeCard";
import { postSubmissionVc } from "@/share/api/submission/postSubmissionVc";

// デバッグ用
// let count = 1;

type Badge = {
  id: number;
  name: string;
  status: "importing" | "complete" | "paused" | "error";
  reason_code?: number | string;
};

type Props = {
  badgeList: any[];
  consumer: any;
  submissionEmail: string | null;
  externalLinkageId: string | null;
};

const Load = ({ badgeList, consumer, submissionEmail, externalLinkageId }: Props) => {
  const [progressData, setProgressData] = useState<Badge[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  // 初期化：最初の1件目をimporting状態にして開始
  useEffect(() => {
    if (badgeList.length === 0) return;

    const initialProgress: Badge[] = badgeList.map((badge, idx) => ({
      id: badge.badgeVcId,
      name: badge.badgeName,
      status: idx === 0 ? "importing" : "paused",
    }));
    setProgressData(initialProgress);
    setCurrentIndex(0);
    setInitialized(true);
  }, [badgeList]);

  useEffect(() => {
    const submitBadge = async () => {
      if (
        currentIndex >= badgeList.length ||
        !consumer ||
        !submissionEmail ||
        !externalLinkageId
      ) {
        return;
      }

      const badge = badgeList[currentIndex];
      console.log("current badge full:", badge);

      try {
        const response = await postSubmissionVc({
          consumerId: consumer.consumerId,
          email: submissionEmail,
          badgeVcId: badge.badgeVcId,
          externalLinkageId,
        });

        // デバッグ用スリープ処理
        /*
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        await sleep(3000);
        interface Response {
          result: string;
          reason_code: number;
        }
        let response: Response = { result: "", reason_code: 0 };
        if (count === 1) {
          response = { result: "success", reason_code: 0 };
        } else if (count === 2) {
          response = { result: "error", reason_code: 101 };
        } else if (count === 3) {
          response = { result: "error", reason_code: 103 };
        } else {
          response = { result: "error", reason_code: 999 };
        }
        count += 1;
        */

        const updated = [...progressData];
        updated[currentIndex].status = response.result === "success" ? "complete" : "error";

        if (response.reason_code !== undefined) {
          updated[currentIndex].reason_code = response.reason_code;
        }

        setProgressData(updated);

        const nextIndex = currentIndex + 1;
        if (nextIndex < badgeList.length) {
          updated[nextIndex].status = "importing";
          setProgressData([...updated]);
          setCurrentIndex(nextIndex);
        } else {
          sessionStorage.clear();
        }
      } catch (err: any) {
        const updated = [...progressData];
        updated[currentIndex].status = "error";
        if (err?.response?.data?.reason_code !== undefined) {
          updated[currentIndex].reason_code = Number(err.response.data.reason_code);
        }
        setProgressData(updated);

        const nextIndex = currentIndex + 1;
        if (nextIndex < badgeList.length) {
          setTimeout(() => {
            updated[nextIndex].status = "importing";
            setProgressData([...updated]);
            setCurrentIndex(nextIndex);
          }, 200);
        } else {
          sessionStorage.clear();
        }
      }
    };

    if (
      progressData.length > 0 &&
      progressData[currentIndex]?.status === "importing"
    ) {
      submitBadge();
    }
  }, [currentIndex, progressData, badgeList, consumer, submissionEmail, externalLinkageId]);

  // beforeunload ガード（リロード/タブ閉じ対応）
  useEffect(() => {
    if (!initialized) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasPending = progressData.some(
        (badge) => badge.status === "importing" || badge.status === "paused"
      );
      if (!hasPending) return;

      const updated = progressData.map((badge) =>
        badge.status === "importing" ? { ...badge, status: "paused" as const } : badge
      );
      setProgressData(updated);
      sessionStorage.setItem("progressData", JSON.stringify(updated));

      const message = "進行中のバッジ提出があります。ページを離れると、処理が中断されます。";
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [initialized, progressData]);

  // ページ遷移ガード（戻る・他ページへ）
  useEffect(() => {
    if (!initialized) return;

    const confirmLeave = () => {
      const hasPending = progressData.some(
        (badge) => badge.status === "importing" || badge.status === "paused"
      );
      if (!hasPending) return true;

      return window.confirm(
        "進行中のバッジ提出があります。ページを離れると、処理が中断されます。移動してもよろしいですか？"
      );
    };

    const handleRouteChangeStart = () => {
      const allow = confirmLeave();
      if (!allow) {
        router.events.emit("routeChangeError");
        setTimeout(() => {
          throw new Error("Route change aborted by user.");
        });
      }
    };

    const handleBeforePopState = () => {
      return confirmLeave(); // trueなら遷移許可、falseならキャンセル
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.beforePopState(handleBeforePopState);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.beforePopState(() => true); // 初期化解除
    };
  }, [initialized, progressData, router]);

  return (
    <Box p={6}>
      <VStack align="start" spacing={4}>
        {progressData.map((badge, idx) => {
          let badgeVc = badgeList[idx];
          let badgeName = badgeVc.badgeName;

          try {
            // eslint-disable-next-line no-control-regex
            const cleanedJson = badgeVc?.badge_json?.replace(/[\u0000-\u001F]+/g, "");
            const parsedJson = cleanedJson ? JSON.parse(cleanedJson) : null;
            const description = parsedJson?.description;
            const imageUrl = parsedJson?.image?.id || "";

            badgeName =
              parsedJson?.alignments?.[1]?.targetName ||
              parsedJson?.name ||
              badgeVc.badgeName;

            badgeVc = {
              ...badgeVc,
              vcDataPayload: JSON.stringify({
                vc: {
                  credentialSubject: {
                    photo: imageUrl,
                    description: description,
                  },
                },
              }),
              submissions: [],
            };
          } catch (e) {
            console.warn("badge_json のパース失敗:", e);
          }

          return (
            <BadgeVcCardDetail
              key={idx}
              badgeVc={badgeVc}
              onDeleteClick={() => console.log("delete clicked")}
              badgeExportData={""}
              status={badge.status}
              reason_code={badge.reason_code}
              badgeName={badgeName}
            />
          );
        })}
      </VStack>
    </Box>
  );
};

export default Load;

