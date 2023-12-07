import { Box, Center, Divider, Flex, Text, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useRef } from "react";

import { PrimaryButton } from "@/components/ui/button/PrimaryButton";
import { BasicDialog } from "@/components/ui/dialog/BasicDialog";
import { pagePath } from "@/constants";
import { getCookieValue } from "@/lib/cookie";
import { getUserInfoFormJwt } from "@/lib/userInfo";
import { postNewWallet } from "@/share/api/wallet/postNewWallet";

export const EntryWallet = () => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const session_cookie = getCookieValue("session_cookie");
  const { displayName } = getUserInfoFormJwt(session_cookie);

  const handleClickButton = async () => {
    await postNewWallet();

    onOpen();
  };
  return (
    <Flex direction={"column"} px={{ base: 4, sm: 0 }}>
      <Center>
        <Text as="h1" fontSize={{ base: "2xl", sm: "3xl" }} mt={{ base: 8, sm: 4 }}>
          ウォレット作成
        </Text>
      </Center>
      <Box mt={{ base: 8, sm: 16 }}>
        <Text as="h2" fontSize={{ base: "xl", sm: "2xl" }}>
          氏名
        </Text>
        <Box mt={4} px={8}>
          <Text fontSize={{ base: "md", sm: "xl" }}>{displayName}</Text>
        </Box>
        <Divider />
      </Box>
      <Box mt={16}>
        <Center>
          <PrimaryButton size={"md"}>
            <Text fontSize={"sm"} onClick={() => handleClickButton()}>
              ウォレットを作成する
            </Text>
          </PrimaryButton>
        </Center>
      </Box>
      <BasicDialog
        title="ウォレットの作成が完了しました！"
        okButtonrText="ウォレットへ"
        isOpen={isOpen}
        onClose={onClose}
        cancelRef={cancelRef}
        handleOkClick={() => router.push(pagePath.credential.list)}
      />
    </Flex>
  );
};
