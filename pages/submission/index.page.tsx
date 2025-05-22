import { Box } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

import { Layout } from "@/components/Layout";
import { Metatag } from "@/components/Metatag";
import { SubmissionBadge } from "@/components/page/submission/SubmissionBadge";
import { PageTitle } from "@/components/ui/text/PageTitle";
import { SERVICE_NAME, SERVICE_DESCRITION } from "@/configs";
import { pageName, sessionStorageKey } from "@/constants";
import { submissionBadge } from "@/server/repository/submissionBadge";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;

  if (req.method === "POST") {
    const chunks: Uint8Array[] = [];

    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    const bodyString = Buffer.concat(chunks).toString();
    const params = new URLSearchParams(bodyString);
    const submissionRaw = params.get("post_json");

    if (!submissionRaw) {
      return {
        props: {
          badgeList: [],
          consumer: null,
          badgeConsumers: [],
          error: "バッジデータが見つかりませんでした。",
        },
      };
    }

    const submissionData = JSON.parse(submissionRaw);

    const badgeList = (submissionData.badge_list || []).map((badge) => {
      let parsedBadgeJson = null;
      try {
        // eslint-disable-next-line no-control-regex
        const cleaned = badge.badge_json.replace(/[\u0000-\u001F]+/g, "");
        parsedBadgeJson = JSON.parse(cleaned);
      } catch (e) {
        console.warn("バッジJSONのパースに失敗:", e);
      }
      return {
        ...badge,
        badgeVcId: badge.badge_vc_id,
        badge_json_parsed: parsedBadgeJson,
      };
    });

    let consumerName = "提供者不明";
    if (badgeList[0]?.badge_json_parsed?.issuer?.name) {
      consumerName = badgeList[0].badge_json_parsed.issuer.name;
    }

    // バッジIDを使って提出先リストを取得
    const { badgeConsumers } = await submissionBadge({ badgeVcId: badgeList[0].badgeVcId });

    return {
      props: {
        badgeList,
        consumer: {
          consumerId: 999,
          consumerName,
        },
        badgeConsumers,
        error: null,
      },
    };
  }

  // GETアクセス時（セッションから復元する）
  return {
    props: {
      badgeList: null,
      consumer: null,
      badgeConsumers: null,
      error: null,
    },
  };
};

const SubmissionEnterPage = ({ badgeList, consumer, badgeConsumers, error }) => {
  const [localBadgeList, setLocalBadgeList] = useState([]);
  const [localConsumer, setLocalConsumer] = useState(null);
  const [localBadgeConsumers, setLocalBadgeConsumers] = useState([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (error) {
      setLocalError(error);
      return;
    }

    // POST経由で来たデータがあればそのまま使う
    if (badgeList && consumer && badgeConsumers) {
      setLocalBadgeList(badgeList);
      setLocalConsumer(consumer);
      setLocalBadgeConsumers(badgeConsumers);
      setReady(true);

      try {
        sessionStorage.setItem(sessionStorageKey.badgeVcList, JSON.stringify(badgeList));
        sessionStorage.setItem(sessionStorageKey.consumer, JSON.stringify(consumer));
        sessionStorage.setItem(sessionStorageKey.badgeConsumers, JSON.stringify(badgeConsumers));
      } catch (e) {
        console.warn("セッション情報の保存に失敗:", e);
      }

      return;
    }

    // GETアクセス時は sessionStorage から復元する
    const savedBadgeList = sessionStorage.getItem(sessionStorageKey.badgeVcList);
    const savedConsumer = sessionStorage.getItem(sessionStorageKey.consumer);
    const savedConsumers = sessionStorage.getItem(sessionStorageKey.badgeConsumers);

    if (savedBadgeList && savedConsumer && savedConsumers) {
      try {
        setLocalBadgeList(JSON.parse(savedBadgeList));
        setLocalConsumer(JSON.parse(savedConsumer));
        setLocalBadgeConsumers(JSON.parse(savedConsumers));
        setReady(true);
      } catch (e) {
        setLocalError("セッション情報の復元に失敗しました。");
      }
    } else {
      setLocalError("不正なアクセスです。情報が見つかりません。");
    }
  }, [badgeList, consumer, badgeConsumers, error]);

  if (localError) {
    return (
      <Layout align="center" textAlign="center" maxW="md">
        <Metatag title={SERVICE_NAME} description={SERVICE_DESCRITION} />
        <PageTitle title={pageName.submission} />
        <Box color="red.500" mt={4}>{localError}</Box>
      </Layout>
    );
  }

  if (!ready) return <div>読み込み中...</div>;

  return (
    <Layout align="center" textAlign="center" maxW="md">
      <Metatag title={SERVICE_NAME} description={SERVICE_DESCRITION} />
      <PageTitle title={pageName.submission} />
      {/* badgeConsumers を渡す */}
      <SubmissionBadge
        badgeList={localBadgeList}
        consumer={localConsumer}
        badgeConsumers={localBadgeConsumers}
      />
    </Layout>
  );
};

export default SubmissionEnterPage;