import {
  Flex,
  Box,
  FormLabel,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
  useDisclosure,
  AlertDialogFooter,
} from "@chakra-ui/react";
import React, { Dispatch, useEffect, useRef, useState } from "react";

import { Loading } from "@/components/Loading";
import { MoodleLoginForm } from "@/components/model/moodle/MoodleLoginform";
import { SecondaryButton } from "@/components/ui/button/SecondaryButton";
import { ImportBadgeCard } from "@/components/ui/card/ImportBadgeCard";
import { fetchBadgeMetaDataApi } from "@/share/api/badgeMetaData/fetchBadgeMetaDataApi";
import { badgeListActions, badgeListGetters } from "@/share/store/badgeList/main";
import { selectBadgeGetters } from "@/share/store/selectBadge/main";
import { IfBadgeInfo, IfUserBadgeStatus, ImportingBadgeStatus } from "@/types/BadgeInfo";
import { BadgeMetaData } from "@/types/badgeInfo/metaData";
import { SafeLmsList } from "@/types/lms";

export type ImportingBadgeStatusList = {
  badgeList: ImportingBadgeStatus[];
  metaDataList: BadgeMetaData[];
}

export const BadgeList = ({
  lmsList,
  cbBadgeSelect,
}: {
  lmsList: SafeLmsList[];
  cbBadgeSelect: Dispatch<ImportingBadgeStatusList>;
}) => {
  const cancelRef = useRef();
  const { badgeList, loginError } = badgeListGetters.useBadgeList();
  const selectBadge = selectBadgeGetters.useSelectBadgeData();
  const { fetchBadgeList } = badgeListActions.useFetchBadgeList();
  const { clearBadgeList } = badgeListActions.useClearBadgeList();
  const [selectLmsId, setSelectLmsId] = useState(selectBadge.lmsId.toString());
  const [isNeedMoodleLogin, setIsNeedMoodleLogin] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [ badgeMetaDataList, setBadgeMetaDataList ] = useState<BadgeMetaData[]>([]);
  const clearBadgeMetaDataList = () => {
    badgeMetaDataList.length = 0;
  }

  const fetchMoodleMyBadges = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await fetchBadgeList({ username, password, lmsId: Number(selectLmsId) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeIssuer = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectLmsId(e.target.value);
    if (e.target.value === "") {
      clearBadgeList();
      return;
    }

    setIsLoading(true);

    const selectIssuer = lmsList.filter((x) => x.lmsId.toString() === e.target.value)[0];
    const { lmsId, ssoEnabled } = selectIssuer;

    if (!ssoEnabled) {
      setIsNeedMoodleLogin(true);
      setIsLoading(false);
      return;
    }

    try {
      await fetchBadgeList({ lmsId });
    } finally {
      setIsLoading(false);
    }
  };
  const handleBadgeSelect = (badgeList: IfBadgeInfo[]) => {
    console.log("handleBadgeSelect", badgeList);
    if (badgeMetaDataList.length === 0) 
      return;

    const importBadges = badgeList.map((badge) => {
      const userStatus: Partial<IfUserBadgeStatus> = {
        lms_id: Number(selectLmsId),
        lms_name: lmsList.find((item) => item.lmsId.toString() === selectLmsId)?.lmsName || '',
        lms_url: lmsList.find((item) => item.lmsId.toString() === selectLmsId)?.lmsUrl || '',
      };

      return {
          ...badge,
          ...userStatus,
      } as ImportingBadgeStatus;
    });
    cbBadgeSelect({ badgeList:importBadges, metaDataList:badgeMetaDataList });
  };

  useEffect(() => {
    if (loginError) {
      onOpen();
      setSelectLmsId("");
    }
    const fetchBadgeMetaData = async () => {
      const mdList: BadgeMetaData[] = [];
      for (let i=0 ; i < badgeList.length ; i++) {
        try {
          const badge = badgeList[i];
          const { uniquehash } = badge;
          const lmsUrl = lmsList.find((item) => item.lmsId.toString() === selectLmsId)?.lmsUrl || ''
          const md = await fetchBadgeMetaDataApi({ uniquehash, lmsUrl: lmsUrl });
          mdList[i] = md.data;
        } catch(e) {
          console.error("Error fetching badge metadata:", e);
        }
      }
      setBadgeMetaDataList(mdList);
    }
    fetchBadgeMetaData();
  }, [badgeList]); // badgeListが変更されたときに実行

  useEffect(() => {
    return () => {
      clearBadgeList();
      clearBadgeMetaDataList();
    };
  }, []);

  if (isNeedMoodleLogin) {
    return (
      <MoodleLoginForm
        setIsNeedMoodleLogin={setIsNeedMoodleLogin}
        setSelectLmsId={setSelectLmsId}
        getMyBadges={fetchMoodleMyBadges}
        lmsName={lmsList.find((item) => item.lmsId.toString() === selectLmsId).lmsName}
      />
    );
  } else {
    return (
      <>
        {/** desktop */}
        <Flex
          display={{ base: "none", sm: "flex" }}
          w="full"
          justify={"space-between"}
          direction={"row"}
          alignItems={"flex-end"}
        >
          <Box mt={4}>
            <FormLabel mb={2} fontSize={"md"}>
              学習サービス名選択
            </FormLabel>
            <Select w={72} value={selectLmsId} onChange={(e) => handleChangeIssuer(e)}>
              <option value="">選択してください</option>
              {lmsList.map((item) => {
                const key = item.lmsId;
                return (
                  <option key={key} value={key}>
                    {item.lmsName}
                  </option>
                );
              })}
            </Select>
          </Box>
        </Flex>

        {/** smart phone */}
        <Flex
          display={{ base: "flex", sm: "none" }}
          w="full"
          justify={"space-between"}
          direction={"column"}
          alignItems={"center"}
        >
          <Box w={"full"} mt={8}>
            <FormLabel mb={2} fontSize={"sm"}>
              学習サービス名選択
            </FormLabel>
            <Select value={selectLmsId} onChange={(e) => handleChangeIssuer(e)}>
              <option value="">選択してください</option>
              {lmsList.map((item) => {
                const key = item.lmsId;
                return (
                  <option key={key} value={key}>
                    {item.lmsName}
                  </option>
                );
              })}
            </Select>
          </Box>
        </Flex>

        <Flex w="full" align={"center"} direction={"column"}>
          {
            isLoading ? (
                <Loading message="バッジリスト読込中" />
            ) : (
                badgeList.length !== 0 ? (
                <>
                    <Box m={4}>
                    <AcquireAllButton onClick={() => handleBadgeSelect(badgeList)}/>
                    </Box>
                    {badgeList.map((badge, idx) => {
                        console.debug("badgeMetaDataList[idx]", badgeMetaDataList[idx]);
                        return (
                            <Box m={4} key={idx}>
                            <ImportBadgeCard 
                                key={idx}
                                imageURL={badgeMetaDataList[idx]?.badge.image}
                                badgeName={badge.name}
                                description={badge.description}
                                // 選択したバッジをインポート対象として渡す
                                setIsBadgeSelect={() => handleBadgeSelect([badge])}
                            />
                            </Box>
                        )
                    })}
                </>
                ) : (
                <></>
                )
          )}
        </Flex>
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                ログインエラー
              </AlertDialogHeader>

              <AlertDialogBody>ユーザー名、パスワードが一致しませんでした</AlertDialogBody>

              <AlertDialogFooter>
                <SecondaryButton ref={cancelRef} onClick={onClose}>
                  閉じる
                </SecondaryButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </>
    );
  }
};

const AcquireAllButton = ( {onClick} ) => {
    return (
      <button style={styles.button} onClick={onClick}>
        発行されているバッジを全て獲得する
      </button>
    );
  };
  
  const styles = {
    button: {
      backgroundColor: 'black',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
    }
  };
  