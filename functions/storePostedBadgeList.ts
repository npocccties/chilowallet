export function restorePostedDataInSessionStorage(
  badgeList: any[],
  key: string
) {  // postされたバッジリストがあれば、それを保存
  console.debug("restorePostedDataInSessionStorage", badgeList, key);
  if (badgeList.length > 0) {
    console.info("セッションストレージに保存:", badgeList);
    try {
      sessionStorage.setItem(key, JSON.stringify(badgeList));
    } catch (e) {
      console.warn('セッション情報の保存に失敗:', e);
    }
    return badgeList;
  } 

  // 無ければ、sessionStorageから取り出しをトライ
  const savedBadgeList = sessionStorage.getItem(key);
  if (savedBadgeList) {
    console.info("セッションストレージから復元:", savedBadgeList);
    try {
      badgeList = JSON.parse(savedBadgeList);
      return badgeList;
    } catch(e) {
      console.error(e);
    }
  } 
  console.warn("セッションストレージにバッジリストがありません。");
  return [];
}