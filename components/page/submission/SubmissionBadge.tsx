import {
  Box,
  VStack,
  FormLabel,
  Select,
  Input,
  Flex,
  Text,
  Checkbox,
  Divider,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { PrimaryButton } from "@/components/ui/button/PrimaryButton";
import { sessionStorageKey } from "@/constants";
import { sendEmailFormSchema } from "@/lib/validation";
import { sendConfirmEmail } from "@/share/api/submission/sendConfirmEmail";
import { processingScreenActions } from "@/share/store/ui/processingScreen/man";
import { SendMail } from "@/types/api/submission";

type InputForm = {
  consumerId: number | string;
  email: string;
  sameIdForEmail: boolean;
  externalLinkageId: string;
  confirmLinkageId: string;
};

type ConsumerData = {
  consumerId: number;
  consumerName: string;
};

type BadgeVcData = {
  enrolled: boolean;
  issued: boolean;
  imported: boolean;
  submitted: boolean;
  course_name: string;
  issued_at: string;
  badge_expired_at: string;
  badge_name: string;
  lms_name: string;
  lms_url: string;
  badge_json: string;
};

type Props = {
  badgeList: BadgeVcData[];
  consumer: ConsumerData;
  badgeConsumers: ConsumerData[];
};

export const SubmissionBadge = ({ badgeList, badgeConsumers }: Props) => {
  const router = useRouter();
  const { showProcessingScreen } = processingScreenActions.useShowProcessingScreen(); // 処理中画面表示

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<InputForm>({
    defaultValues: {
      consumerId: "",
    },
    resolver: zodResolver(sendEmailFormSchema),
  });

  const sameIdForEmail = watch("sameIdForEmail");

  const onSubmit = async (input: InputForm) => {

    if (input.externalLinkageId !== input.confirmLinkageId) {
      alert("指定されたIDが確認フォームの内容と一致しません。");
      return;
    }

    const consumerId = typeof input.consumerId === "string" ? Number(input.consumerId) : input.consumerId;
    const selectedConsumer = badgeConsumers.find((c) => c.consumerId === consumerId);
    if (!selectedConsumer) {
      alert("無効な提出先が選択されています。");
      return;
    }

    const data = await showProcessingScreen<SendMail>(() => sendConfirmEmail({ email: input.email, consumerId }));

    sessionStorage.setItem(sessionStorageKey.confirmCode, data.hashConfirmCode);
    sessionStorage.setItem(sessionStorageKey.submissionEmail, input.email);
    sessionStorage.setItem(sessionStorageKey.externalLinkageId, input.externalLinkageId);

    const selectConsumer = {
      consumerId: selectedConsumer.consumerId,
      consumerName: selectedConsumer.consumerName,
    };
    sessionStorage.setItem(sessionStorageKey.consumer, JSON.stringify(selectConsumer));

    reset(); // フォームリセット

    // 確認ページに遷移
    sessionStorage.setItem(sessionStorageKey.badgeVc, JSON.stringify(badgeList));
    router.push("/submission/confirm");
  };

  useEffect(() => {
    if (sameIdForEmail) {
      const email = getValues("email");
      setValue("externalLinkageId", email);
      setValue("confirmLinkageId", email);
    } else {
      setValue("externalLinkageId", "");
      setValue("confirmLinkageId", "");
    }
  }, [sameIdForEmail, getValues, setValue]);

  return (
    <>
      <Box mb={-5} w="full" textAlign="left">
        <Text mb={2}>{badgeList.length} 件のバッジを選択中</Text>
        <VStack align="start" spacing={1}>
          {badgeList.map((badge, idx) => {
            return (
              <Box key={idx}>
                <Text>・{badge.badge_name}</Text>
              </Box>
            );
          })}
        </VStack>
        <Divider mt={4} />
      </Box>

      <form style={{ width: "100%" }} onSubmit={handleSubmit(onSubmit)}>
        <VStack w={"full"} alignItems={"flex-start"} gap={6}>
          <Box w={"full"}>
            <FormLabel mb={2}>バッジ提出先選択</FormLabel>
            <Select {...register("consumerId", { required: true })} defaultValue="">
              <option value="" disabled hidden>
                選択してください
              </option>
              {badgeConsumers.map((c) => (
                <option key={c.consumerId} value={c.consumerId}>
                  {c.consumerName}
                </option>
              ))}
            </Select>
            <Text size="xs" mt={2}>
              {errors.consumerId?.message}
            </Text>
          </Box>
          <Box w={"full"}>
            <FormLabel mb={2}>emailアドレス</FormLabel>
            <Input
              placeholder="email@example.com"
              type={"email"}
              maxLength={256}
              {...register("email")}
            />
            <Text size="xs" mt={2}>
              {errors.email?.message}
            </Text>
          </Box>

          <Box
            as="section"
            w={"full"}
            border={"1px solid #ddd"}
            borderRadius={"md"}
            padding={6}
          >
            <Box mb={4}>
              <FormLabel mb={0}>指定されたID</FormLabel>
              <Box textAlign={"right"}>
                <Checkbox size={"md"} colorScheme={"primary"} {...register("sameIdForEmail")}>
                  emailアドレスと同じ場合
                </Checkbox>
              </Box>
            </Box>
            <Box w={"full"} mb={4}>
              <Input maxLength={256} {...register("externalLinkageId")} />
              <Text size="xs" mt={2}>
                {errors.externalLinkageId?.message}
              </Text>
            </Box>
            <Box w={"full"}>
              <FormLabel mb={2}>確認のため再度入力してください。</FormLabel>
              <Input maxLength={256} {...register("confirmLinkageId")} />
              <Text size="xs" mt={2}>
                {errors.confirmLinkageId?.message}
              </Text>
            </Box>
          </Box>

          <Box w={"full"}>
            <Flex justifyContent={"center"}>
              <PrimaryButton type="submit" w={200}>
                確認コードを送信する
              </PrimaryButton>
            </Flex>
          </Box>
        </VStack>
      </form>
    </>
  );
};