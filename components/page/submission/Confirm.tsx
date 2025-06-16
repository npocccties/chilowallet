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
import React, { useState, useEffect } from "react";

import Load from "@/components/page/submission/Load";
import { PrimaryButton } from "@/components/ui/button/PrimaryButton";
import { SecondaryButton } from "@/components/ui/button/SecondaryButton";
import { sessionStorageKey } from "@/constants";

type ConsumerData = {
  consumerId: number;
  consumerName: string;
};

type BadgeVcData = {
  badgeVcId: number;
  badge_name: string;
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
  const [isConfirmed, setIsConfirmed] = useState(false);

  const badgeVc = Array.isArray(badgeList) ? badgeList[0] : badgeList;
  const badgeVcId = router.query.badge_vc_id;

  const submissionEmail = sessionStorage.getItem(sessionStorageKey.submissionEmail);
  const externalLinkageId = sessionStorage.getItem(sessionStorageKey.externalLinkageId);

  useEffect(() => {
    // 戻るボタンでの状態遷移に対応
    window.onpopstate = (event) => {
      if (!event.state?.isConfirmed) {
        setIsConfirmed(false);
      }
    };
  }, []);

  const handleOpenModal = async () => {
    const hashConfirmCode = sessionStorage.getItem(sessionStorageKey.confirmCode);
    const hashInput = await generateHash(codeInput);

    if (hashConfirmCode !== hashInput) {
      alert("確認コードが一致しません");
      return;
    }

    // 履歴を上書きして、戻るボタンで認証後の画面に戻らないようにする
    window.history.replaceState({ isConfirmed: true }, "", router.asPath);
    setIsConfirmed(true);
  };

  const handleCancel = () => {
    const normalizedBadgeList = Array.isArray(badgeList) ? badgeList : [badgeList];
    sessionStorage.setItem(sessionStorageKey.badgeVcList, JSON.stringify(normalizedBadgeList));
    sessionStorage.setItem(sessionStorageKey.consumer, JSON.stringify(consumer));
    sessionStorage.setItem(sessionStorageKey.submissionEmail, submissionEmail || "");
    sessionStorage.setItem(sessionStorageKey.externalLinkageId, externalLinkageId || "");

    router.push("/submission");
  };

  async function generateHash(confirmCode: string) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(confirmCode);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  if (badgeVcId && badgeVc.badgeVcId.toString() !== badgeVcId) {
    router.push("/404");
    return null;
  }

  if (!submissionEmail || !consumer || !badgeVc) {
    return (
      <Box>
        <WarningIcon w={8} h={8} color="status.caution" />
        <Text>セッション情報がありません</Text>
        <SecondaryButton onClick={() => router.push("/submission")}>
          確認コードを再発行する
        </SecondaryButton>
      </Box>
    );
  }


  if (isConfirmed) {
    const normalizedBadgeList = Array.isArray(badgeList) ? badgeList : [badgeList];
    return (
      <Load
        badgeList={normalizedBadgeList}
        consumer={consumer}
        submissionEmail={submissionEmail}
        externalLinkageId={externalLinkageId}
      />
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
        {(Array.isArray(badgeList) ? badgeList : [badgeList]).map((badge, idx) => (
          <Box key={idx}>
            <Text>・{badge.badge_name}</Text>
          </Box>
        ))}

      </VStack>

      <Divider mt={4} />

      <VStack align="start" spacing={6} mt={8}>
        <Field label="提出先名" value={consumer.consumerName} />
        <Field label="提出者Emailアドレス" value={submissionEmail} />
        <Field label="指定されたID" value={externalLinkageId} />

        <Box w="full">
          <FormLabel mb={2}>確認コードを入力</FormLabel>
          <Input
            type="text"
            maxLength={10}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
          />
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

const Field = ({ label, value }: { label: string; value: string | null }) => (
  <Box w="full" textAlign="left">
    <Text color="gray" mb={1}>{label}</Text>
    <Text fontSize="lg" mb={2}>{value}</Text>
    <Divider />
  </Box>
);

export default Confirm;