import {
    Grid,
    GridItem,
    Image,
    Text,
    Box,
  } from "@chakra-ui/react";
import React from "react";

  import { StatusIcon } from "@/components/StatusIcon";
  
type LoadBadgeCardProps = {
    expired?: string | null;
    imageURL: string; 
    status: "importing" | "complete" | "paused" | "error";
    reason_code?: number | string | null;
    badgeName: string;
    description: string | "説明が見つかりません";
    isShowError?: boolean | true
  };
  
  export const LoadBadgeCard = (props: LoadBadgeCardProps) => {
    const { imageURL, expired, badgeName, description } = props;
    return (
      <Grid
        border={"main"}
        rounded="2xl"
        templateColumns={"repeat(3, 1fr)"}
        templateRows={"auto auto"}
        p={{ base: 3, sm: 5 }}
        backgroundColor={expired ? "gray.300" : "white"}
        w={{ base: "100%", sm: "500px", md: "600px" }}
      >
        {/* 左のバッジ画像 */}
        <GridItem
          display={"grid"}
          placeItems={"center"}
          rowSpan={2}
          colSpan={1}
          rowStart={1}
          colStart={1}
          p={{ base: 1, sm: 2 }}
        >
          <Image
            fit={"cover"}
            src={imageURL} // ← Base64ではなくURLがそのまま入っている前提
            alt="バッジ画像"
          />
        </GridItem>
  
        {/* 中央のタイトルと説明・ステータス */}
        <GridItem
          px="2"
          py="1"
          margin={"0"}
          rowSpan={1}
          colSpan={2}
          rowStart={1}
          colStart={2}
        >
          <Box>
            <Box display="flex" justifyContent="flex-start" alignItems="center" mb={2}>
                <StatusIcon isShowError={props.isShowError} status={props.status} reason_code={props.reason_code}/>
              
            </Box>
            <Text fontWeight="bold" fontSize="lg" textAlign="left" w="100%">
              {badgeName}
            </Text>
            <Text color="gray.600" fontSize="sm" w="100%" textAlign="left">
              {description}
            </Text>
            {expired && (
              <Text fontSize="xs" mt={1} color="red.500">
                有効期限切れ
              </Text>
            )}
          </Box>
        </GridItem>
      </Grid>
    );
  };
  