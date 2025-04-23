import { Grid, GridItem, Image, Text ,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    useDisclosure,
  } from "@chakra-ui/react";
  import React, { useRef } from "react";
  
  import { DangerButton } from "@/components/ui/button/DangerButton";
  import { PrimaryButton } from "@/components/ui/button/PrimaryButton";
  import { SecondaryButton } from "@/components/ui/button/SecondaryButton";
  import { isBefoerCurrentTimeJST } from "@/lib/date";
  import { VcDetailData } from "@/types/api/credential/detail";
  
  
  type BadgeVcCardDetailProps = {
    badgeVc: VcDetailData;
    onDeleteClick: () => void;
    badgeExportData: string;
  };
  
  export const BadgeVcCardDetail = (props: BadgeVcCardDetailProps) => {
    const { badgeVc, onDeleteClick, badgeExportData } = props
    const cancelRef = useRef();
    const vcPayload = badgeVc.vcDataPayload && JSON.parse(badgeVc.vcDataPayload);
    const image = vcPayload?.vc?.credentialSubject.photo;
    const isDeleteDisabled = badgeVc.submissions.length !== 0;
    const expired = isBefoerCurrentTimeJST(badgeVc.badgeExpires);
    const { isOpen, onOpen, onClose } = useDisclosure();  
  
    const onClickDelete = () => {
      onDeleteClick();
    };
  
    return (
      <Grid
        border={"main"}
        rounded="2xl"
        templateColumns={"repeat(3, 1fr)"}
        templateRows={"2"}
        p={{ base: 3, sm: 6 }}
        backgroundColor={expired && "gray.300"}
      >
        <GridItem display={"grid"} placeItems={"left"} rowSpan={1} colSpan={1} rowStart={1} colStart={2} p={{ base: 1, sm: 2 }}>
          <DangerButton w={160} disabled={isDeleteDisabled} onClick={onOpen}>
            削除
          </DangerButton>
        </GridItem>
        <GridItem display={"grid"} placeItems={"left"} rowSpan={1} colSpan={1} rowStart={1} colStart={3} p={{ base: 1, sm: 2 }}>
          <PrimaryButton
            as="a"
            w={160}
            href={`data:image/png;base64,${badgeExportData}`}
            download={`${badgeVc.badgeName}.png`}>
            エクスポート
          </PrimaryButton>
        </GridItem>
        <GridItem display={"grid"} placeItems={"left"} rowSpan={2} colSpan={1} rowStart={1} colStart={1} p={{ base: 1, sm: 2 }}>
          <Image fit={"cover"} src={"data:image/png;base64," + image} alt={"test"} />
        </GridItem>
        
        <GridItem px="2" py="1" alignItems="center" margin={"0"} rowSpan={1} colSpan={2} rowStart={2} colStart={2} >
          <Text fontSize={{ sm: "xl", base: "md" }} fontWeight={"bold"}>
            {badgeVc.badgeName}
          </Text>
          {expired && (
            <Text fontSize={{ base: "12px", sm: "sm" }} mt={2}>
              有効期限切れ
            </Text>
          )}
        </GridItem>
        <GridItem px="2" py="1" alignItems="center" margin={"0"} rowSpan={1} colSpan={2} rowStart={3} colStart={2} >
          <Text fontSize={{ base: "12px", sm: "sm" }} fontWeight={"bold"}>
              {badgeVc.description}
          </Text>
        </GridItem>
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  バッジ削除
                </AlertDialogHeader>
  
                <AlertDialogBody>
                  本当にこのバッジを削除しますか？
                  <br />
                  この操作は取り消せません。
                </AlertDialogBody>
  
                <AlertDialogFooter>
                  <SecondaryButton ref={cancelRef} onClick={onClose}>
                    キャンセル
                  </SecondaryButton>
                  <DangerButton
                    ml={3}
                    onClick={() => {
                      onClickDelete()
                    }}
                  >
                    削除
                  </DangerButton>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
      </Grid>
    );
  };
  
  