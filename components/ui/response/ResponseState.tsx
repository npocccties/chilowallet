import { Box, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { ReactNode } from "react";

import { SecondaryButton } from "../button/SecondaryButton";

import { pagePath } from "@/constants";

export const ResponseState = ({ icon, status, message }: { icon: ReactNode; status: string; message: string }) => {
  const router = useRouter();
  return (
    <>
      <Box>
        <Box mb={4}>{icon}</Box>
        <Text>{status}</Text>
      </Box>
      <Box>
        <Text fontSize={"lg"}>{message}</Text>
      </Box>
      <Box>
        <SecondaryButton onClick={() => router.push(pagePath.credential.list)}>ウォレットに戻る</SecondaryButton>
      </Box>
    </>
  );
};