import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    PopoverArrow,
    PopoverCloseButton,
    Button,
    Link,
    Text
} from "@chakra-ui/react";
import Issuer from "public/portal/issuer.svg"; // SVGRで読み込み済み

import { urlInfo } from "./urls"

/* tailwindによる、Popoverの移植が上手く行かない場合に... */
export const IssuerMenu = ({ issuers }: { issuers: urlInfo[] }) => {
    return (    
      <Popover placement="bottom-start">
        <PopoverTrigger>
          <Button
            variant="ghost"
            size="sm"
            px={2}
            className="jumpu-text-button"
            color="white"
            _hover={{ bg: "gray.700" }}
            leftIcon={<Issuer className="fill-white size-[1.125rem]" alt="" />}
          >
            <Text fontSize="16" fontWeight="normal">
                発行元
            </Text>
          </Button>
        </PopoverTrigger>
        <PopoverContent bg="black" borderColor="gray.500" zIndex={2000}>
          <PopoverArrow bg="black" />
          <PopoverCloseButton color="white" />
          <PopoverBody className="text-white text-sm p-2 max-h-[80vh] overflow-y-auto">
            <ul role="menu" className="list-none">
              {issuers.map((issuer, index) => (
                <li key={index} role="menuitem">
                  <Link
                    href={issuer.url}
                    className="block w-max min-w-full px-4 py-3 rounded-sm hover:bg-gray-700"
                  >
                    {issuer.name}
                  </Link>
                </li>
              ))}
            </ul>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
};
  
export default IssuerMenu;