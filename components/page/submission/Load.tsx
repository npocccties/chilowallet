// components/page/submission/Load.tsx

import { Box, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { BadgeVcCardDetail } from "@/components/ui/card/LoadBadgeCard";
import { postSubmissionVc } from "@/share/api/submission/postSubmissionVc";

// デバッグ用
//let count = 1;

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
        //デバッグ
        /*const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(3000);
        interface Response {
          result: string;
          reason_code: number;
        }
        let response: Response = { result: "" ,reason_code:0};
        if(count == 1){
          response = { result: "success",reason_code:0 };
        }else if(count == 2){
          response = { result: "error",reason_code:101 };
        }else if(count == 3){
          response = { result: "error",reason_code:103 };
        }else{
          response = { result: "error",reason_code:999 };
        }
        count+=1;*/

        const updated = [...progressData];
        updated[currentIndex].status = response.result === "success" ? "complete" : "error";

        if (response.reason_code !== undefined) {
          updated[currentIndex].reason_code = response.reason_code;
        }

        setProgressData(updated);

        // 次のバッジへ進める
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

        // エラーでも次のバッジへ進める
        const nextIndex = currentIndex + 1;
        if (nextIndex < badgeList.length) {
          setTimeout(() => {
            updated[nextIndex].status = "importing";
            setProgressData([...updated]);
            setCurrentIndex(nextIndex);
          }, 200); // ← 状態更新の反映を少し待ってから
        } else {
          sessionStorage.clear();
        }
      };
    };

    if (
      progressData.length > 0 &&
      progressData[currentIndex]?.status === "importing"
    ) {
      submitBadge();
    }
  }, [currentIndex, progressData, badgeList, consumer, submissionEmail, externalLinkageId]);

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

            // badgeNameを正しく取得
            badgeName = parsedJson?.alignments?.[1]?.targetName || parsedJson?.name || badgeVc.badgeName;

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
              badgeExportData={""} // 使わない場合は空でOK
              status={badge.status}
              reason_code={badge.reason_code}
              badgeName={badgeName} // badgeNameを渡す
            />
          );
        })}
      </VStack>
    </Box>
  );
};

export default Load;
