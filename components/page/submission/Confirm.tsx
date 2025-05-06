import { WarningIcon } from "@chakra-ui/icons";
import {
  Box,
  VStack,
  FormLabel,
  Input,
  Flex,
  Text,
  Divider,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useState } from "react";

import { PrimaryButton } from "@/components/ui/button/PrimaryButton";
import { SecondaryButton } from "@/components/ui/button/SecondaryButton";
import { pagePath, sessionStorageKey } from "@/constants";

type ConsumerData = {
  consumerId: number;
  consumerName: string;
};

type BadgeVcData = {
  badgeVcId: number;
  badgeName: string;
  badgeIssuedon: string;
  vcImage: string;
  badge_json?: string;
};

type Props = {
  consumer: ConsumerData;
  badgeList: BadgeVcData | BadgeVcData[];
};

const Confirm = ({ consumer, badgeList }: Props) => {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState("");
  const badgeVc = Array.isArray(badgeList) ? badgeList[0] : badgeList;
  const badgeVcId = router.query.badge_vc_id;

  const submissionEmail = sessionStorage.getItem(sessionStorageKey.submissionEmail);
  const externalLinkageId = sessionStorage.getItem(sessionStorageKey.externalLinkageId);

  // 提出処理
  const handleOpenModal = async () => {
    const hashConfirmCode = sessionStorage.getItem(sessionStorageKey.confirmCode);
    const hashInput = await generateHash(codeInput);

    
    if (hashConfirmCode !== hashInput) {
      alert("確認コードが一致しません");
      return;
    }
    
    

    const normalizedBadgeList = Array.isArray(badgeList) ? badgeList : [badgeList];

    // セッションに情報を保存
    sessionStorage.setItem(sessionStorageKey.badgeVcList, JSON.stringify(normalizedBadgeList));
    sessionStorage.setItem(sessionStorageKey.consumer, JSON.stringify(consumer));
    sessionStorage.setItem(sessionStorageKey.submissionEmail, submissionEmail || "");
    sessionStorage.setItem(sessionStorageKey.externalLinkageId, externalLinkageId || "");

    router.push("/submission/confirm/load");
    
  };

  // ハッシュ化
  async function generateHash(confirmCode: string) {
    const encoder = new TextEncoder();
    const encodedCode = encoder.encode(confirmCode.toString());
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedCode);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

    return hashHex;
  }

  // キャンセル時：元の submission 入力ページへ戻す（badge_vc_id を維持）
  const handleCancel = () => {
    // sessionStorage に再度必要な情報を保存（戻った先で復元できるように）
    const normalizedBadgeList = Array.isArray(badgeList) ? badgeList : [badgeList];
    sessionStorage.setItem(sessionStorageKey.badgeVcList, JSON.stringify(normalizedBadgeList));
    sessionStorage.setItem(sessionStorageKey.consumer, JSON.stringify(consumer));
    sessionStorage.setItem(sessionStorageKey.submissionEmail, submissionEmail || "");
    sessionStorage.setItem(sessionStorageKey.externalLinkageId, externalLinkageId || "");

    router.push("/submission");
  };

  // badge_vc_id 不一致なら 404
  if (badgeVcId && badgeVc.badgeVcId.toString() !== badgeVcId) {
    router.push("/404");
    return null;
  }

  // セッション情報がなければエラー表示
  if (!submissionEmail || !consumer || !badgeVc) {
    const returnPath = `${pagePath.submission.enter}/${router.query.badge_vc_id}`;
    return (
      <Box>
        <WarningIcon w={8} h={8} color="status.caution" />
        <Text>セッション情報がありません</Text>
        <SecondaryButton onClick={() => router.push(returnPath)}>
          確認コードを再発行する
        </SecondaryButton>
      </Box>
    );
  }

  return (
    <Box>
      <Text mb={2} textAlign="center" whiteSpace="pre-line">
        入力されたemailアドレス宛に{"\n"}
        確認コードを記載したメールが送信されました。{"\n"}
        メールのご確認をお願いします。
      </Text>
      <Text mb={2} textAlign="left">
        {Array.isArray(badgeList) ? badgeList.length : 1} 件のバッジを選択中
      </Text>
      <VStack align="start" spacing={1}>
        {(Array.isArray(badgeList) ? badgeList : [badgeList]).map((badge, idx) => {
          let targetName = badge.badgeName;
          try {
            // eslint-disable-next-line no-control-regex
            const cleanedJson = badge.badge_json?.replace(/[\u0000-\u001F]+/g, "");
            const parsed = cleanedJson ? JSON.parse(cleanedJson) : null;
            const alignments = parsed?.alignments || [];
            targetName = alignments[1]?.targetName || badge.badgeName;
          } catch (e) {
            console.warn("badge_json のパースに失敗:", e);
          }

          return (
            <Box key={idx}>
              <Text>・{targetName}</Text>
            </Box>
          );
        })}
      </VStack>

      <Divider mt={4} />

      <VStack align="start" spacing={6} mt={8}>
        <Field label="提出先名" value={consumer.consumerName} />
        <Field label="提出者Emailアドレス" value={submissionEmail} />
        <Field label="指定されたID" value={externalLinkageId} />

        <Box w="full">
          <FormLabel mb={2}>確認コードを入力</FormLabel>
          <Input type="text" maxLength={10} onChange={(e) => setCodeInput(e.target.value)} />
        </Box>

        <Flex justifyContent="space-between" w="full">
          <SecondaryButton w={140} onClick={handleCancel}>
            キャンセル
          </SecondaryButton>
          <PrimaryButton w={140} onClick={handleOpenModal}>
            バッジを提出
          </PrimaryButton>
        </Flex>
      </VStack>
    </Box>
  );
};

// 表示用フィールド
const Field = ({ label, value }: { label: string; value: string | null }) => (
  <Box w="full" textAlign="left">
    <Text color="gray" mb={1}>{label}</Text>
    <Text fontSize="lg" mb={2}>{value}</Text>
    <Divider />
  </Box>
);

export default Confirm;
