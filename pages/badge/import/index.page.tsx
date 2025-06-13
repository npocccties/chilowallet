import { GetServerSideProps, GetServerSidePropsResult } from "next";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";

import { Layout } from "@/components/Layout";
import { Metatag } from "@/components/Metatag";
import { ImportingBadgeStatusList, BadgeList } from "@/components/page/badge/ListInLmslist";
import { Load } from "@/components/page/badge/Load";
import { PageTitle } from "@/components/ui/text/PageTitle";
import { SERVICE_DESCRITION, SERVICE_NAME } from "@/configs";
import { pageName, pagePath, sessionStorageKey } from "@/constants";
import { errors } from "@/constants/error";
import { logEndForPageSSR, logStartForPageSSR, logStatus } from "@/constants/log";
import { getPostBadgeList, PostedBadgeList } from "@/functions/getPostbody";
import { getIfBadgeInfoSSO } from "@/functions/importBadge";
import { restorePostedDataInSessionStorage } from "@/functions/storePostedBadgeList";
import { loggerError, loggerInfo } from "@/lib/logger";
import { getUserInfoFormJwt } from "@/lib/userInfo";
import { findAllSafeLmsList } from "@/server/repository/lmsList";
import { createWallet } from "@/server/repository/wallet";
import { getWalletId } from "@/server/services/wallet.service";
import { BadgeMetaData } from "@/types/badgeInfo/metaData";
import { SafeLmsList } from "@/types/lms";

type Props = {
  lmsList: SafeLmsList[];
  postedBadgeList: PostedBadgeList;
  isFoundWallet: boolean;
};

const page = pagePath.badge.import;

export const getServerSideProps: GetServerSideProps = async ({ req }): Promise<GetServerSidePropsResult<Props>> => {
  loggerInfo(logStartForPageSSR(page));

  const session_cookie = req.cookies.session_cookie;
  const { eppn } = getUserInfoFormJwt(session_cookie);
  let isFoundWallet = false
  try {
    const id = await getWalletId(eppn);    
    if (id) {
      isFoundWallet = true
    }
    loggerInfo(`Found walletId: ${id}`);
  } catch (e) {
    loggerInfo(`Not found walletId`);
  }

  // ウォレットが無い場合、自動的に作成する
  if (!isFoundWallet) {
    try {
      await createWallet(eppn)
      const id = await getWalletId(eppn);    
      if (id) {
        isFoundWallet = true
      }
      loggerInfo(`Found walletId: ${id}`);
    } catch (e) {
      loggerError("Failed to create wallet")
    }
  }

  try {
    const lmsList = await findAllSafeLmsList();
    loggerInfo(`${logStatus.success} ${page}`);
    const postedBadgeList = await getPostBadgeList(req)
    loggerInfo(logEndForPageSSR(page));
    return { 
      props: { 
        lmsList: lmsList, 
        postedBadgeList: postedBadgeList, 
        isFoundWallet: isFoundWallet
      } 
    };
  } catch (e) {
    loggerError(`${logStatus.error} ${page}`, e.message);
    throw new Error(errors.response500.message);
  }
};


const ImportVCPage = (props: Props) => {  
  const { lmsList, postedBadgeList, isFoundWallet } = props;
  const [importBadges, setImportBadges] = useState([]);
  const [metaDataList, setMetaDataList] = useState<BadgeMetaData[]>([]);
  const [isBadgeSelect, setIsBadgeSelect] = useState<boolean | null>(null);
  const pageWidth = "md";
  const router = useRouter();
  
  useEffect(() => {
    console.debug("postedBadgeList", postedBadgeList);
    const restoredList = restorePostedDataInSessionStorage(
      postedBadgeList.badgeList,
      sessionStorageKey.postedBadgeList
    );
    console.debug("restoredList", restoredList);
    if (isFoundWallet === false) {
      console.info("Go to error page");
      router.push(pagePath.login.error);
    } else {
      // インポート対象バッジがある場合、インポートページへ
      setIsBadgeSelect(restoredList.length > 0);
      const fetchBadges = async () => {
        const iBs = await getIfBadgeInfoSSO(restoredList);
        console.debug("importBadges", iBs);
        setImportBadges(iBs);
      };
      fetchBadges();
    }
  }, []); //描画時に一度だけ実行
  
  // BadgeListから選択されたバッジを取得し、インポートページへ
  const selectImportBadges = (badgeList: ImportingBadgeStatusList) => {
    console.debug("selectImportBadges", badgeList);
    setImportBadges(badgeList.badgeList);
    setMetaDataList(badgeList.metaDataList);
    setIsBadgeSelect(true);
  }
  if (isBadgeSelect === null) {
    return (
      <Layout align="center" textAlign="center" maxW={pageWidth}>
        <></> 
      </Layout>
    )
  }

  return (
    <Layout align="center" textAlign="center" maxW={pageWidth}>
      <Metatag title={SERVICE_NAME} description={SERVICE_DESCRITION} />
      {isFoundWallet ? (
      <>
        <PageTitle title={pageName.badge.import} />
        {isBadgeSelect === true ? (
          <Load badgeList={importBadges} metaDataList={metaDataList} />
        ) : (
          <BadgeList lmsList={lmsList} cbBadgeSelect={selectImportBadges} />
        )}
      </>
      ) : (
      <></>
      )}
    </Layout>
  );
};

export default ImportVCPage;
