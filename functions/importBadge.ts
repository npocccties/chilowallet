import { importBadgeConvertToVc } from "@/share/api/badgeImport/importBadgeConvertVc";
import { fetchBadgeListApi } from "@/share/api/badgeList/fetchBadgeListApi";
import { fetchBadgeMetaDataApi } from "@/share/api/badgeMetaData/fetchBadgeMetaDataApi";
import { IfUserBadgeStatus, IfBadgeInfo, ImportingBadgeStatus } from "@/types/BadgeInfo";

export async function getIfBadgeInfoSSO(userBadges: IfUserBadgeStatus[]): Promise<ImportingBadgeStatus[]> {
  // IfBadgeInfoのIDと、それを取得したLMSのURLを保持し、badge_class_idと比較する。
  type myBadgePeer = {
    iBInfo: IfBadgeInfo;
    lmsUrl: string;
  }
  
  const importingBadgeList: ImportingBadgeStatus[] = [];
  const gotLmsId = new Set<number>();
  const myBadges: myBadgePeer[] = []
  const addedBadgeIds = new Set<string>(); // 追加したバッジ情報の重複を、IDで判定して排除

  for (const b of userBadges) {
    // 既に取得したLMSはスキップ
    if (gotLmsId.has(b.lms_id) === true) {
      continue
    }
    // [NOTE] SSOの場合、POSTに必要なパラメータはlmsIdのみ。
    // ポータルダッシュボードからPOSTされるのはLMS(SSO)由来の想定。
    const myB = await fetchBadgeListApi({lmsId: b.lms_id})
    for (const x of myB.badgeList) {
      myBadges.push({iBInfo: x, lmsUrl: b.lms_url});
    }
    gotLmsId.add(b.lms_id)
  }
  
  // [NOTE] badge_class_idとgetMyBadgesのidは等価。
  for (const userB of userBadges) {
    for (const myB of myBadges) {
      if (isMatchedBadgeClassId(userB.badge_class_id, myB.lmsUrl, myB.iBInfo.id)) {
        // すでに追加したバッジ情報でなければ、追加する。(重複排除)
        if (addedBadgeIds.has(userB.badge_class_id) === false) {
          importingBadgeList.push({...userB, ...myB.iBInfo});
          addedBadgeIds.add(userB.badge_class_id);
        }
      }
    }
  }

  return importingBadgeList;
}

// POSTデータのbadge_class_id...https://dev-lms.oku.cccties.org/badges/badge_json.php?id=17
// LMSから取得したID...(number)
function isMatchedBadgeClassId(badgeClassId: string, lms_url: string, id: number): boolean {
  return (badgeClassId === `${lms_url}/badges/badge_json.php?id=${id}`)
}

export function parseBadgeJson(badgeJson: string): any {
  try {
    const parsedJson = JSON.parse(badgeJson);  // badge_jsonをJSONとしてパース
    return parsedJson;  // パースしたJSONを返す
  } catch (e) {
    console.warn("Error parsing badge_json:", e);  // エラーログを出力
  }
  return {}
}

export async function importBadge(uniquehash: string, email: string, lmsId: number, lmsName: string) {
    const badgeMetaDataResponse = await fetchBadgeMetaDataApi({ uniquehash, lmsUrl: lmsName });
    const badgeMetaData = badgeMetaDataResponse.data;
    await importBadgeConvertToVc({ uniquehash, email, badgeMetaData, lmsId, lmsName });
};
