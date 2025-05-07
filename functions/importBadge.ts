import { importBadgeConvertToVc } from "@/share/api/badgeImport/importBadgeConvertVc";
import { fetchBadgeListApi } from "@/share/api/badgeList/fetchBadgeListApi";
import { fetchBadgeMetaDataApi } from "@/share/api/badgeMetaData/fetchBadgeMetaDataApi";
import { IfUserBadgeStatus, IfBadgeInfo, ImportingBadgeStatus } from "@/types/BadgeInfo";

export async function getIfBadgeInfoSSO(userBadges: IfUserBadgeStatus[]): Promise<ImportingBadgeStatus[]> {
  const importingBadgeList: ImportingBadgeStatus[] = [];
  const gotLMS = new Set<string>();
  const myBadges: IfBadgeInfo[] = []

  for (const b of userBadges) {
    // 既に取得したLMSはスキップ
    if (b.lms_id in gotLMS) {
      continue
    }
    // [NOTE] SSOの場合、POSTに必要なパラメータはlmsIdのみ。
    const myB = await fetchBadgeListApi({lmsId: b.lms_id})
    myBadges.push(...myB.badgeList);
    gotLMS.add(b.lms_url)
  }
  
  // [NOTE] badge_class_idとgetMyBadgesのidは等価。
  for (const userB of userBadges) {
    for (const myB of myBadges) {
      if (isMatchedBadgeClassId(userB.badge_class_id, myB.id)) {
        importingBadgeList.push({...userB, ...myB});
      }
    }
  }

  return importingBadgeList;
}

// POSTデータのbadge_class_id...https://dev-lms.oku.cccties.org/badges/badge_json.php?id=17
// LMSから取得したID...(number)
function isMatchedBadgeClassId(badgeClassId: string, id: number): boolean {
  // badge_class_idの形式を正規表現で抽出
  const regex = /id=(\d+)/; 
  const match = badgeClassId.match(regex);  // badge_class_idからidを抽出
  try {
    if (match) {  // idが抽出できた場合
      const extractedId = parseInt(match[1], 10);  // idを数値に変換
      return extractedId === id;  // idが一致するか比較
    }
  } catch (e) {
    console.error("Error parsing badge_class_id:", e);  // エラーログを出力
  }
  return false
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
