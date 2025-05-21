// components/page/submission/Load.tsx

import { Box, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { BadgeVcCardDetail } from "@/components/ui/card/LoadBadgeCard";
import { postSubmissionVc } from "@/share/api/submission/postSubmissionVc";

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

  // リロード / タブ・ウィンドウ閉じる / ブラウザバック
  useEffect(() => {
    if (!initialized) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasPending = progressData.some(
        (badge) => badge.status === "importing" || badge.status === "paused"
      );
      if (!hasPending) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [initialized, progressData]);

  // Next.js の画面遷移
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
      if (!confirmLeave()) {
        router.events.emit("routeChangeError");
        throw "Abort route change.";
      }
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
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

            badgeName = badgeVc.badge_name;

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