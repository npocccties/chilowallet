import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Icon } from "@iconify/react";
// import { pagesPath } from "lib/$path";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, Fragment, useId } from "react";

import { logoLink, dashboardLink, learningLink, issuerInfos, footerInfos } from "./urls";

type Props = {
  open: boolean;
  onClose(): void;
};
function Menu({ open, onClose }: Props) {
  const { events } = useRouter();
  useEffect(() => {
    events.on("routeChangeStart", onClose);
    return () => {
      events.off("routeChangeStart", onClose);
    };
  });
  //const { data: issuers, error: issuersError } = useIssuers();
  const issuers = issuerInfos;
  const id = useId();
  return (
    <Transition appear show={open} as={Fragment}>
      {/* z-[index] を、呼び出し元コンポーネントより高くすることで、オーバーレイ表示すること。*/}
      <Dialog as="div" className="relative z-[1100]" onClose={onClose}> 
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="bg-transparent"
          enterTo="bg-black/30"
          leave="ease-out duration-300"
          leaveFrom="bg-black/30"
          leaveTo="bg-transparent"
        >
          <div className="fixed inset-0" />
        </TransitionChild>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="left-full"
          enterTo="left-0"
          leave="ease-out duration-300"
          leaveFrom="left-0"
          leaveTo="left-full"
        >
          <div className="fixed inset-0 overflow-x-hidden overflow-y-auto">
            <DialogPanel className="w-screen bg-white px-4 pt-6 pb-12 min-h-full relative">
              <div className="mb-8 sticky top-3 flex justify-end pr-6">
                <button
                  className="text-right jumpu-icon-button group mb-8 sticky top-6"
                  onClick={onClose}
                  aria-describedby={id}
                >
                  <Icon className="text-xl text-black" icon="fa6-solid:xmark" />
                </button>
              </div>
              <ul className="mb-12 space-y-1">
                <li>
                  <Link
                    className="jumpu-text-button font-bold w-full text-gray-700 hover:bg-gray-100"
                    href={logoLink}
                  >
                    ホーム
                  </Link>
                </li>
                <li>
                  <Link
                    className="jumpu-text-button font-bold w-full text-gray-700 hover:bg-gray-100"
                    href={dashboardLink}
                  >
                    ダッシュボード
                  </Link>
                </li>
                <li>
                  <Link
                    className="jumpu-text-button font-bold w-full text-gray-700 hover:bg-gray-100"
                    href={learningLink}
                  >
                    学びを探す
                  </Link>
                </li>
                <li>
                  <p className="text-gray-400 font-bold px-[1.25em] py-[0.75em]">
                    発行元
                  </p>
                  <ul className="pl-4 mb-3 space-y-1">
                    {issuers.map((issuer, index) => (
                        <li key={index} role="menuitem">
                          <Link
                            href={issuer.url}
                            className="jumpu-text-button font-bold w-full text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {issuer.name}
                          </Link>
                        </li>
                      ))
                    }
                  </ul>
                </li>
              </ul>
              <ul className="space-y-1">
                {footerInfos.map((content) => (
                  <li key={id}>
                    <Link
                      className="jumpu-text-button font-bold w-full text-gray-700 hover:bg-gray-100"
                      href={content.url}
                    >
                      {content.name}
                    </Link>
                  </li>
                ))}
              </ul>
              
            </DialogPanel>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

export default Menu;
