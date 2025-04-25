import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { Layout } from "@/components/Layout";
import { Metatag } from "@/components/Metatag";
import Load from "@/components/page/submission/Load";
import { PageTitle } from "@/components/ui/text/PageTitle";
import { SERVICE_NAME, SERVICE_DESCRITION } from "@/configs";
import { pageName, sessionStorageKey } from "@/constants";

const EnterPage = () => {
  const [badgeList, setBadgeList] = useState<any[]>([]);
  const [consumer, setConsumer] = useState<any | null>(null);
  const [submissionEmail, setSubmissionEmail] = useState<string | null>(null);
  const [externalLinkageId, setExternalLinkageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try{
      const storedBadgeList = sessionStorage.getItem(sessionStorageKey.badgeVcList);
      const storedConsumer = sessionStorage.getItem("consumer");
      const email = sessionStorage.getItem("submissionEmail");
      const externalId = sessionStorage.getItem("externalLinkageId");

      if (!storedBadgeList || !storedConsumer || !email || !externalId) {
        setError("不正なアクセスです。情報が見つかりません。");
        return;
      }

      
      setBadgeList(JSON.parse(storedBadgeList));
      setConsumer(JSON.parse(storedConsumer));
      setSubmissionEmail(email);
      setExternalLinkageId(externalId);
    } catch (e) {
      console.error("データ取得中にエラー:", e);
      setError("データの読み込みに失敗しました。");
    }

  },[]);

  if (error) {
    return (
      <Layout align="center" textAlign="center" maxW="md">
        <Metatag title={SERVICE_NAME} description={SERVICE_DESCRITION} />
        <PageTitle title={pageName.submission} />
        <Box color="red.500" mt={4}>{error}</Box>
      </Layout>
    );
  }

  if (!badgeList.length || !consumer || !submissionEmail || !externalLinkageId) {
    return null; // ローディングまたは読み込み失敗
  }

  return (
    <Layout align="center" textAlign="center" maxW="md">
      <Metatag title={SERVICE_NAME} description={SERVICE_DESCRITION} />
      <PageTitle title={pageName.submission} />
      <Load badgeList={badgeList} consumer={consumer} submissionEmail={submissionEmail} externalLinkageId={externalLinkageId}/>
    </Layout>
  );
};

export default EnterPage;
