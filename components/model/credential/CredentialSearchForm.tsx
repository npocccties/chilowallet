import {
  Grid,
  FormControl,
  Input,
  GridItem,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Flex,
  FormLabel,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PrimaryButton } from "@/components/ui/button/PrimaryButton";
import { SecondaryButton } from "@/components/ui/button/SecondaryButton";
import { dateSchema } from "@/lib/validation";
import { credentialListActions } from "@/share/store/credentialList/main";
import { SearchFormItem } from "@/types/api/credential/index";

const sortButtonText = {
  ask: {
    mode: "ask",
    text: "発行日（古い順）",
  },
  desc: {
    mode: "desk",
    text: "発行日（新しい順）",
  },
};

export const SearchForm = () => {
  const [sortState, setSortState] = useState(sortButtonText.desc);
  const { searchCredentialList } = credentialListActions.useSearchCredentialList();
  const { sortOrderCredentialList } = credentialListActions.useSortOrderCredentialList();
  const formSchema = z.object({
    badgeName: z.string(),
    issuedFrom: dateSchema,
    issuedTo: dateSchema,
  });
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<SearchFormItem>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (values: SearchFormItem) => {
    const param: SearchFormItem = {
      badgeName: values.badgeName,
      issuedFrom: values.issuedFrom,
      issuedTo: values.issuedTo,
      sortOrder: sortState.mode,
    };

    searchCredentialList(param);
  };

  const handleClickSort = () => {
    if (sortState.mode === sortButtonText.ask.mode) {
      setSortState(sortButtonText.desc);
      sortOrderCredentialList(sortButtonText.desc.mode);
    } else if (sortState.mode === sortButtonText.desc.mode) {
      setSortState(sortButtonText.ask);
      sortOrderCredentialList(sortButtonText.ask.mode);
    }
  };

  return (
    <>
      <Box border={"2px solid"} borderColor={"gray.200"} borderRadius={"2xl"} overflow={"hidden"}>
        <Accordion allowToggle borderRadius={"2xl"}>
          <AccordionItem border={"none"}>
            <AccordionButton _expanded={{ bg: "gray.300", boxShadow: "none" }}>
              <AccordionIcon />
              <Box as="span" flex={"1"} textAlign={"left"}>
                <h2>検索</h2>
              </Box>
            </AccordionButton>
            <AccordionPanel>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl>
                  <Grid gridTemplateColumns={"repeat(2, 1fr)"} justifyContent={"center"} gap={{ base: 2, sm: 4 }}>
                    <GridItem colSpan={2}>
                      <FormLabel htmlFor="badgeName" mt={4}>
                        バッジ名
                      </FormLabel>
                      <Input
                        id="badgeName"
                        {...register("badgeName", {
                          maxLength: { value: 256, message: "256文字以内で入力してください。" },
                        })}
                        maxW={"100%"}
                      />
                      <Text size="xs" mt={2}>
                        {errors.badgeName?.message}
                      </Text>
                    </GridItem>
                    <GridItem>
                      <FormLabel htmlFor="issuedFrom">発行日From</FormLabel>
                      <Input id="issuedFrom" type="date" {...register("issuedFrom")} />
                      <Text size="xs" mt={2}>
                        {errors.issuedFrom?.message}
                      </Text>
                    </GridItem>
                    <GridItem>
                      <FormLabel htmlFor="issuedTo">発行日To</FormLabel>
                      <Input id="issuedTo" type="date" {...register("issuedTo")} />
                      <Text size="xs" mt={2}>
                        {errors.issuedTo?.message}
                      </Text>
                    </GridItem>
                    <GridItem></GridItem>
                    <GridItem>
                      <PrimaryButton mt={8} w={"100%"} isLoading={isSubmitting} type="submit">
                        検索
                      </PrimaryButton>
                    </GridItem>
                  </Grid>
                </FormControl>
              </form>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
      <Flex mt={4} justifyContent={"flex-end"}>
        <SecondaryButton w={180} onClick={() => handleClickSort()}>
          {sortState.text}
        </SecondaryButton>
      </Flex>
    </>
  );
};
