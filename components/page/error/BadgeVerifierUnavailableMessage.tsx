import { Link, Text } from "@chakra-ui/react";

import { contactInfo } from "@/components/portal_components/urls";
import { errors } from "@/constants/error";

type Props = {
  // どの操作ができなかったか（インポート／提出）
  action: "import" | "submission";
};

/**
 * バッジ検証サービスが停止していて、インポート・提出ができないことを利用者に伝えるメッセージ。
 * ポータルのフッターに「お問い合わせ」のリンクが設定されていれば、そのリンクを案内する。
 */
export const BadgeVerifierUnavailableMessage = ({ action }: Props) => {
  const { badgeVerifierUnavailable } = errors;

  return (
    <>
      <Text mb={2}>{badgeVerifierUnavailable[action]}</Text>
      <Text>
        {badgeVerifierUnavailable.contact}
        {contactInfo && (
          <>
            {" "}
            <Link href={contactInfo.url} isExternal textDecoration="underline">
              {contactInfo.name}
            </Link>
          </>
        )}
      </Text>
    </>
  );
};
