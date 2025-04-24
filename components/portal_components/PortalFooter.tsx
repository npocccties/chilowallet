import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import React, { useId } from "react";

import { logoLink, footerInfos } from "./urls";

type Props = {
  className?: string;
};

function PortalFooter({ className }: Props) {
  const id = useId();
  console.log(footerInfos)
  return (
    <footer
      className={clsx("bg-black mt-4 lg:pb-10 pt-12 pb-32 md:py-8", className)}
    >
      <div className="container px-6 flex flex-col md:flex-row items-center justify-center gap-10">
        <Link href={logoLink} className="shrink-0">
          <Image
            src="/portal/logo.svg"
            width={128}
            height={32}
            alt="トップページに戻る"
          />
        </Link>
        <ul className="text-white text-xs flex items-center flex-wrap gap-4">
          {footerInfos.map((footerInfo) => (
            <li key={id}>
              <Link
                href={footerInfo.url}
                className="hover:underline"
              >
                {footerInfo.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

export default PortalFooter;
