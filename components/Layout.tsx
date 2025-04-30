import { Flex, Box, Container, Stack, useDisclosure, Drawer, DrawerContent, DrawerOverlay } from "@chakra-ui/react";
import React from "react";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { SidebarContent } from "./Sidebar";

import { ReturnButton } from "@/components/ui/button/ReturnButton";
import { useBackUrl } from "@/functions/useBackUrl"

export interface LayoutProps {
  children: React.ReactNode;
  showHeaderContents?: boolean;
  maxW?: string;
  textAlign?: "center";
  align?: string;
}

export const Layout: React.VFC<LayoutProps> = ({ children, maxW, textAlign, align, showHeaderContents = true }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const returnTo = useBackUrl();
  return (
    <Flex minHeight={"100vh"} direction={"column"} 
      justify={"center"}
      position={"relative"}
      align={"center"}
      overflow={"visible"}
      >
      <Header onOpen={onOpen} showContents={showHeaderContents} />
      <Box ml="-50%" mt="5">
        <ReturnButton 
          as="a"
          href={returnTo} 
          color={"black"}>
            戻る
        </ReturnButton>
      </Box>
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent maxW={{ base: "full", sm: "xs" }}>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      <Box flex={2}>
        <Container maxW={maxW}>
          <Stack textAlign={textAlign} align={align} spacing={{ base: 8, sm: 10 }} py={{ base: 20, sm: 28 }}>
            {children}
          </Stack>
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
};
