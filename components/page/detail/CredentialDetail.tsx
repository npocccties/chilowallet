import {
  Box
} from "@chakra-ui/react";
import React from "react";

import { BadgeVcCardDetail } from "@/components/ui/card/BadgeVcCardDetail";
import { VcDetailTabPanel } from "@/components/ui/tabPanel/VcDetailTabPanel";
import { isBefoerCurrentTimeJST } from "@/lib/date";
import { vcDetailActions } from "@/share/store/credentialDetail/main";
import { processingScreenActions } from "@/share/store/ui/processingScreen/man";
import { CredentialDetailData } from "@/types/api/credential/detail";

export const CredentialDetail: React.FC<CredentialDetailData> = ({
  vcDetailData,
  knowledgeBadges,
  submissionsHistories,
  badgeExportData,
}) => {
  // const cancelRef = useRef();
  const expired = isBefoerCurrentTimeJST(vcDetailData.badgeExpires);
  // const isDeleteDisabled = vcDetailData.submissions.length !== 0;
  const { showProcessingScreen } = processingScreenActions.useShowProcessingScreen();

  const { deleteCredential } = vcDetailActions.useDeleteCredential();
  // const { isOpen, onOpen, onClose } = useDisclosure();

  const handleClickDelete = async () => {
    showProcessingScreen(async () => {
      await deleteCredential(vcDetailData.badgeVcId);
      // 削除後、戻る先は「戻る」ボタンと同じ
      const backUrl = sessionStorage.getItem("back_url") || process.env.NEXT_PUBLIC_BACK_URL;
      console.debug(`backUrl: ${backUrl}`);
      // ページ遷移時の警告抑制のため、イベントを解除
      window.onbeforeunload = null;
      window.removeEventListener('beforeunload', () => {})
      window.location.href = backUrl;
    });
  };
  return (
    <>
      {vcDetailData && (
        <Box>
          <Box mb={12}>
            <BadgeVcCardDetail
              badgeVc={vcDetailData} 
              onDeleteClick={handleClickDelete}
              badgeExportData={badgeExportData}
              />
          </Box>
          <VcDetailTabPanel
            vcDetailData={vcDetailData}
            knowledgeBadges={knowledgeBadges}
            submissionsHistories={submissionsHistories}
            expired={expired}
          />
          {/** 
          <Flex justifyContent={"space-between"} mt={12}>
            <DangerButton w={160} disabled={isDeleteDisabled} onClick={onOpen}>
              削除
            </DangerButton>
            <PrimaryButton
              as="a"
              w={160}
              href={`data:image/png;base64,${badgeExportData}`}
              download={`${vcDetailData.badgeName}.png`}
            >
              エクスポート
            </PrimaryButton>
          </Flex>
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
                      handleClickDelete();
                    }}
                  >
                    削除
                  </DangerButton>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
          */}
        </Box>
      )}
    </>
  );
};
