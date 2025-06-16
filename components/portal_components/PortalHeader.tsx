import { Box, Flex, Text, Link } from "@chakra-ui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import AllBadge from "public/portal/all-badge.svg";
import Issuer from "public/portal/issuer.svg"; // SVGRで読み込み済み
import React, { useEffect, useId } from "react";
import { MdLogout } from "react-icons/md";

//import PopoverFlex from "@/components/portal_components/PopoverFlex"

import Menu from "./Menu";
import { logoLink, dashboardTitle, dashboardLink, learningTitle, learningLink, issuerTitle, issuerInfos } from "./urls";
import useDialog from "./use-dialog";

import Popover from "@/components/portal_components/Popover"
import { getCookieValue } from "@/lib/cookie";
import { getUserInfoFormJwt } from "@/lib/userInfo";


// import { BsWallet2 } from "react-icons/bs";
// import { TbDeviceDesktopAnalytics } from "react-icons/tb";
// import NextLink from "next/link";
// import { linkStyle } from "@/constants/style";

// next.config.jsの、svgr/webpackの記述を追加すること。 

const logoutLink = process.env.NEXT_PUBLIC_LOGOUT_LINK as string;

type Props = {
  showContents: boolean;
  //onOpen: () => void;
};


export const PortalHeader: React.FC<Props> = ({ showContents }) => {
  //const [userName, setUserName] = useState("Unknown");
  const { open, onOpen, onClose } = useDialog();
  const issuers = issuerInfos
  const id = useId();
  const flexMenuItemGap = "20px"
  const flexMenuItemInnerGap = "4px"

  useEffect(() => {
    var errorDetail = "";
    const session_cookie = getCookieValue("session_cookie");
    if (!session_cookie) {
      errorDetail = "Not found session_cookie.";
    } else {
      const userInfo = getUserInfoFormJwt(session_cookie);
      if (!userInfo) {
        errorDetail = "Failed to decode.";
      } else {
        //setUserName(userInfo.displayName);
      }
    }
    if (errorDetail) {
      console.error(errorDetail);
    }
  }, []);

  return (
    <Box as="header" w={"100%"} zIndex={1000}>
      <Flex
        h={"64px"}
        alignItems={"center"}
        justifyContent={"space-between"}
        backgroundColor={"basic.black"}
        p={{ base: 8 }}
      >
        {/*
        <Box display={{ base: "block", md: "none" }}>
          <HamburgerIcon color={"basic.white"} w={6} h={6} cursor={"pointer"} onClick={() => onOpen()} />
        </Box>
        */}
        <Box>
          <Flex gap={flexMenuItemGap} alignItems={"center"} color={"basic.white"}>
            <Link href={logoLink} className="md:mr-10 shrink-0">
                <Image
                    src="/portal/logo.svg"
                    width={128}
                    height={32}
                    alt="ポータルページへ"
                />
            </Link>
            { showContents ? (<>
            <Flex gap={flexMenuItemInnerGap} alignItems={"center"} color={"basic.white"} display={{ base: "none", md: "flex" }}>
              <Icon
                    className="text-xl text-white size=[1.125rem]"
                    icon="mdi:compass-outline"
              />
              <Link
                  href={dashboardLink}
                  className="hidden md:inline-flex jumpu-text-button text-white text-sm hover:bg-gray-700 items-center gap-2 whitespace-nowrap"
              >
                {dashboardTitle}
              </Link>
            </Flex>
            <Flex gap={flexMenuItemInnerGap} alignItems={"center"} color={"basic.white"} display={{ base: "none", md: "flex" }} >
              <AllBadge className="stroke-white size-[1.125rem]" alt="" /> 
              <Link
                  href={learningLink}
                  className="hidden lg:inline-flex jumpu-text-button text-white text-sm hover:bg-gray-700 items-center gap-2 whitespace-nowrap"
                  >
                  {learningTitle}
              </Link>
            </Flex>
            <Flex gap={flexMenuItemInnerGap} alignItems={"center"} color={"basic.white"} display={{ base: "none", md: "flex" }}>
            <Popover
              className="hidden lg:block mt-1" // ウォレット側と合わせるため、mt-1を追加。
              title={
                <>
                <Issuer className="fill-white size-[1.125rem]" alt="" />
                <span>{issuerTitle}</span>
                </>
              }
              >
              {({ close }) => (
                  <ul
                  role="menu"
                  className="jumpu-card bg-black border-gray-500 text-white p-2 text-sm overflow-y-scroll max-h-[80vh]"
                  aria-busy={!issuers}
                  onClick={() => close()}
                  >
                    {issuers.map((issuer) => (
                        <li key={id} role="menuitem">
                        <Link
                            href={issuer.url}
                            className="block w-max min-w-full px-4 py-3 rounded-sm hover:bg-gray-700"
                        >
                            {issuer.name}
                        </Link>
                        </li>
                    ))
                    }
                  </ul>
                )}
            </Popover>
            </Flex>
            </> ) : (
            <Box></Box>
          )}
          </Flex>
        </Box>
        <Box
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        ></Box>
        {/* 
        <Box display={{ base: "none", sm: "block" }}>
          <Flex gap={"8px"} alignItems={"center"} color={"basic.white"}>
            <Link fontSize={"xl"} href={logoutLink} style={{ textDecoration: "none" }}>
              <Box display={"flex"} flexDirection={"row"} alignItems={"center"} gap={1}>
                <MdLogout size="24" />
                <Text>ログアウト</Text>
              </Box>
            </Link>
          </Flex>
        </Box>
        */}
        {/*<Box display={{ base: "block", sm: "none" }}>*/}
        <Box>
          <Flex gap={"8px"} alignItems={"center"} color={"basic.white"}>
            <Link fontSize={"xl"} href={logoutLink} style={{ textDecoration: "none" }}>
              <Box display={"flex"} flexDirection={"row"} alignItems={"center"} gap={1}>
                <MdLogout size="20" />
                <Text fontSize={["sm", "md", "lg", "xl"]}>ログアウト</Text>
              </Box>
            </Link>
            <button
              className="jumpu-icon-button hover:bg-gray-700 group lg:hidden ml-2"
              onClick={onOpen}
              aria-describedby={id}
            >
              <Icon className="text-xl text-white" icon="fa6-solid:bars" />

            </button>
            <Menu open={open} onClose={onClose} />
          </Flex>
           
        </Box>
      </Flex>
    </Box>
  );
};

export default PortalHeader;