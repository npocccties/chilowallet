import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { Layout } from "@/components/Layout";
import { Metatag } from "@/components/Metatag";
import Confirm from "@/components/page/submission/Confirm";
import { PageTitle } from "@/components/ui/text/PageTitle";
import { SERVICE_NAME, SERVICE_DESCRITION } from "@/configs";
import { pageName, sessionStorageKey } from "@/constants";

const SubmissionConfirmPage = () => {
  const [badgeList, setBadgeList] = useState<any[] | null>(null);
  const [consumer, setConsumer] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const badgeListData = sessionStorage.getItem(sessionStorageKey.badgeVc);
      const consumerData = sessionStorage.getItem(sessionStorageKey.consumer);

      if (!badgeListData || !consumerData) {
        setError("不正なアクセスです。情報が見つかりません。");
        return;
      }

      setBadgeList(JSON.parse(badgeListData));
      setConsumer(JSON.parse(consumerData));
    } catch (e) {
      console.error("データ取得中にエラー:", e);
      setError("データの読み込みに失敗しました。");
    }
  }, []);

  if (error) {
    return (
      <Layout align="center" textAlign="center" maxW="md">
        <Metatag title={SERVICE_NAME} description={SERVICE_DESCRITION} />
        <PageTitle title={pageName.submission} />
        <Box color="red.500" mt={4}>{error}</Box>
      </Layout>
    );
  }

  if (!badgeList || !consumer) {
    return null; // ローディング中
  }

  return (
    <Layout align="center" textAlign="center" maxW="md">
      <Metatag title={SERVICE_NAME} description={SERVICE_DESCRITION} />
      <Box mb={-4}>
        <PageTitle title={pageName.submission}/>
      </Box>
      <Confirm badgeList={badgeList} consumer={consumer} />
    </Layout>
  );
};

export default SubmissionConfirmPage;