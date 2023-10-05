import {
  Button,
  Grid,
  FormControl,
  FormLabel,
  Input,
  GridItem,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Flex,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { UseFormHandleSubmit, UseFormRegister } from "react-hook-form";

import { SearchFormItem } from "@/types/data";

type Props = {
  register: UseFormRegister<SearchFormItem>;
  handleSubmit: UseFormHandleSubmit<SearchFormItem, undefined>;
  isSubmitting: boolean;
};

const sortButtonText = {
  ask: "発行日（古い順）",
  desc: "発行日（新しい順）",
};

export const SearchForm = ({ register, handleSubmit, isSubmitting }: Props) => {
  const [sortState, setSortState] = useState(sortButtonText.desc);
  const onSubmit = (values) => {
    // TODO: 未実装
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(JSON.stringify(values, null, 2));
        resolve();
      }, 1000);
    });
  };

  const handleClickSort = () => {
    if (sortState === sortButtonText.ask) {
      // 昇順でAPIリクエスト
      setSortState(sortButtonText.desc);
    } else if (sortState === sortButtonText.desc) {
      // 降順でAPIリクエスト
      setSortState(sortButtonText.ask);
    }
  };

  return (
    <>
      <Box border={"2px solid"} borderColor={"gray.200"} borderRadius={"2xl"} overflow={"hidden"}>
        <Accordion allowToggle borderRadius={"2xl"}>
          <AccordionItem border={"none"}>
            <h2>
              <AccordionButton _expanded={{ bg: "gray.200", boxShadow: "none" }}>
                <AccordionIcon />
                <Box as="span" flex={"1"} textAlign={"left"}>
                  検索
                </Box>
              </AccordionButton>
            </h2>
            <AccordionPanel>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl>
                  <Grid gridTemplateColumns={"repeat(2, 1fr)"} justifyContent={"center"} gap={{ base: 2, sm: 4 }}>
                    <GridItem colSpan={2}>
                      <FormLabel htmlFor="badgeName" mt={4}>
                        バッジ名
                      </FormLabel>
                      <Input id="badgeName" {...register("badgeName")} maxW={"100%"} />
                    </GridItem>
                    <GridItem>
                      <FormLabel htmlFor="issueDateTo">発行日To</FormLabel>
                      <Input id="issueDateTo" type="date" {...register("issueDateTo")} />
                    </GridItem>
                    <GridItem>
                      <FormLabel htmlFor="issueDateEnd">発行日End</FormLabel>
                      <Input id="issueDateEnd" type="date" {...register("issueDateEnd")} />
                    </GridItem>
                    <GridItem></GridItem>
                    <GridItem>
                      <Button colorScheme={"teal"} mt={8} w={"100%"} isLoading={isSubmitting} type="submit">
                        検索
                      </Button>
                    </GridItem>
                  </Grid>
                </FormControl>
              </form>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
      <Flex mt={4} justifyContent={"flex-end"}>
        <Button w={180} colorScheme={"gray"} onClick={() => handleClickSort()}>
          {sortState}
        </Button>
      </Flex>
    </>
  );
};
