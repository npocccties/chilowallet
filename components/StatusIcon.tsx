import { Box, Image, Popover, PopoverTrigger, PopoverArrow, PopoverBody, PopoverContent } from "@chakra-ui/react";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import React from 'react';



type StatusIconProps = {
  status: "importing" | "complete" | "paused" | "error";
  reason_code?: number | string;
};

export const StatusIcon: React.FC<StatusIconProps> = ({ status, reason_code }) => {
  let color = "#1e3050"; // importing 用の色
  const code = Number(reason_code);
  console.log("[StatusIcon] reason_code:", reason_code, "→ parsed:", code);

  const getErrorMessage = () => {
    if (code === 101) {
      return "登録されていないIDです";
    } else if (code === 103) {
      return "バッジの検証に失敗しました";
    } else {
      return "予期せぬエラーが発生しました";
    }
  };

  const getImageSrc = (status: string) => {
    switch (status) {
      case "complete":
        return "/complete.png";
      case "paused":
        return "/paused.png";
      case "error":
        return "/error.png";
      default:
        return "";
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" color={color}>
      {status === "importing" ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <FontAwesomeIcon icon={faSpinner} style={{ fontSize: "50px" }} />
        </motion.div>
      ) : status === "error" ? (
        <Popover placement="bottom-start" isLazy>
          <PopoverTrigger>
            <Image src={getImageSrc(status)} alt={status} boxSize="50px" />
          </PopoverTrigger>
          <PopoverContent w="fit-content" bg="gray.700" color="white" border="none">
            <PopoverArrow bg="gray.700" />
            <PopoverBody>{getErrorMessage()}</PopoverBody>
          </PopoverContent>
        </Popover>
      ) : (
        <Image src={getImageSrc(status)} alt={status} boxSize="50px" />
      )}
    </Box>
  );
};
