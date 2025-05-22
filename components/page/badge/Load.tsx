// components/page/submission/Load.tsx

import { Text, Box, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { LoadBadgeCard } from "@/components/ui/card/LoadBadgeCard";
import { parseBadgeJson } from "@/functions/importBadge";
import { importBadgeConvertToVc } from "@/share/api/badgeImport/importBadgeConvertVc";
import { fetchBadgeMetaDataApi } from "@/share/api/badgeMetaData/fetchBadgeMetaDataApi";
import { ImportingBadgeStatus } from "@/types/BadgeInfo";
import { BadgeMetaData } from "@/types/badgeInfo/metaData";

// デバッグ用
//let count = 1;

type Badge = {
  id: number;
  name: string;
  status: "importing" | "complete" | "paused" | "error";
  reason_code?: number | string;
};

type Props = {
  badgeList: ImportingBadgeStatus[];
  metaDataList?: BadgeMetaData[];
};

const RESULT_SUCCESS = { result: "success"};
const RESULT_ERROR = { result: "error"};

export const Load = ({ badgeList, metaDataList }: Props) => {
  const [progressData, setProgressData] = useState<Badge[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  async function handleImport (
    uniquehash: string, email: string, lmsId: number, lmsUrl: string, lmsName: string, 
    metaData: BadgeMetaData, vcConverted: boolean) {
    if (vcConverted) {
      console.debug("already converted badge, skip import badgeConvertToVc");
      return RESULT_SUCCESS
    }
    try {
        // metaDataが与えられていない場合は、取得する。
        let badgeMetaData: BadgeMetaData | null = metaData;
        if (metaData === null) {
          const badgeMetaDataResponse = await fetchBadgeMetaDataApi({ uniquehash, lmsUrl: lmsUrl });
          badgeMetaData = badgeMetaDataResponse.data;
          console.debug("badgeMetaData:", badgeMetaData);
        }
        await importBadgeConvertToVc({ uniquehash, email, badgeMetaData, lmsId, lmsName });
        return RESULT_SUCCESS;
    } catch(e) {
        console.error("Error during import:", e);
    }
    return RESULT_ERROR
  };
  
  // 初期化：最初の1件目をimporting状態にして開始
  useEffect(() => {
    if (badgeList.length === 0) return;

    const initialProgress: Badge[] = badgeList.map((badge, idx) => ({
      id: badge.id,
      name: badge.name,
      status: idx === 0 ? "importing" : "paused",
    }));
    setProgressData(initialProgress);
    setCurrentIndex(0);
  }, [badgeList]);

  useEffect(() => {
    const importBadge = async () => {
      if (currentIndex >= badgeList.length) {
        return;
      }

      const badge = badgeList[currentIndex];
      
      try {
        const response = await handleImport(
            badge.uniquehash,
            badge.email,
            badge.lms_id,
            badge.lms_url,
            badge.lms_name,
            metaDataList?.[currentIndex] || null,
            badge.vcConverted,
        );

        const updated = [...progressData];
        updated[currentIndex].status = response.result === "success" ? "complete" : "error";
        updated[currentIndex].reason_code = null;
        setProgressData(updated);

        // 次のバッジへ進める
        const nextIndex = currentIndex + 1;
        if (nextIndex < badgeList.length) {
          updated[nextIndex].status = "importing";
          setProgressData([...updated]);
          setCurrentIndex(nextIndex);
        } else {
          // 全てのバッジのインポートが完了した場合、セッションストレージをクリア
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
          // 全てのバッジのインポートが完了した場合、セッションストレージをクリア
          sessionStorage.clear();
        }
      };
    };

    if (
      progressData.length > 0 &&
      progressData[currentIndex]?.status === "importing"
    ) {
      importBadge();
    }
  }, [currentIndex, progressData, badgeList]);

  return (
    <Box p={6}>
      <Text mb={4} fontSize={{base: "xs", sm: "md"}}>バッジインポート中は戻らないようお願いします。</Text>
      <VStack align="start" spacing={4}>
        {progressData.map((badge, idx) => {
          let iBadge = badgeList[idx];
          let badgeUrl = metaDataList[idx]?.badge.image as string || null;
          // POSTデータの場合はbadge_json -> image -> idに、
          // LMSから取得した場合は、metaDataListに画像URLが入っている
          console.debug("iBadge.badge_json:", iBadge.badge_json);
          console.debug("iBadge.badgeurl:", iBadge.badgeurl);
          if (iBadge.badge_json) {
            const badge_json = parseBadgeJson(iBadge.badge_json);
            badgeUrl = badge_json.image?.id? `${badge_json.image.id}` : iBadge.badgeurl;
          }
            
          return (
            <LoadBadgeCard
              key={idx}
              imageURL={badgeUrl}
              status={badge.status}
              reason_code={badge.reason_code}
              badgeName={iBadge.name} // badgeNameを渡す
              description={iBadge.description}
              isShowError={false}
            />
          );
        })}
      </VStack>
    </Box>
  );
};

export default Load;
