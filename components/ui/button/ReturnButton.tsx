import { Button, ButtonProps, forwardRef } from "@chakra-ui/react";

export const ReturnButton = forwardRef<ButtonProps, "button">((props, ref) => {
  return <Button bg={"gray.200"} ref={ref} {...props} />;
});