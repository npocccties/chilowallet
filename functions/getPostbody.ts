import { GetServerSidePropsContext } from 'next';

import { loggerInfo } from '@/lib/logger';

const BodyParameterKey = "post_json"

export type PostedBadgeList = {
  badgeList: any[];
  consumer: {
    consumerId: number;
    consumerName: string;
  };
  error: string | null;
};

export async function getPostBadgeList(req: GetServerSidePropsContext['req']): Promise<PostedBadgeList> {
  if (req.method === "POST") {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    const bodyString = Buffer.concat(chunks).toString();
    const params = new URLSearchParams(bodyString);
    const postRaw = params.get(BodyParameterKey);

    if (!postRaw) {
      return {
        badgeList: [],
        consumer: null,
          error: "バッジデータが見つかりませんでした。", 
      };
    }

    const postData = JSON.parse(postRaw);
    loggerInfo(`POSTデータ: ${JSON.stringify(postData)}`);
    const badgeList = postData.badgeList || [];

    let consumerName = "提供者不明";
    if (badgeList[0]?.badge_json_parsed?.issuer?.name) {
      consumerName = badgeList[0].badge_json_parsed.issuer.name;
    }

    return {
      badgeList,
      consumer: {
        consumerId: 999,
          consumerName,
     },
      error: null,
    };
  }

  // GETアクセスの場合はクライアント側で sessionStorage を参照
  return {
    badgeList: [],
    consumer: null,
    error: null,
  };
}
