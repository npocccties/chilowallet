import { useRouter } from "next/router";
import { useEffect } from "react";

import type { GetServerSidePropsResult, NextPage } from "next";

import { pagePath } from "@/constants";
/*
import { logStartForPageSSR } from "@/constants/log";
import { loggerInfo } from "@/lib/logger";
*/

type Props = {
  isCreatedWallet: boolean;
};

export const getServerSideProps = async function (): Promise<GetServerSidePropsResult<Props>> {
  // 302 リダイレクト
  return {
    redirect: {
      destination: process.env.NEXT_PUBLIC_DASHBOARD_LINK,
      permanent: false, 
    },
  };

  /*
  loggerInfo(logStartForPageSSR(pagePath.credential.list));
  const session_cookie = req.cookies.session_cookie;
  const { eppn } = getUserInfoFormJwt(session_cookie);

  loggerInfo("userInfo verify", eppn);

  try {
    const createdWallet = await findWallet(eppn);

    const isCreatedWallet = !createdWallet ? false : true;

    loggerInfo(`${logStatus.success} ${pagePath.credential.list}`);
    return {
      props: {
        isCreatedWallet,
      },
    };
  } catch (e) {
    loggerError(`${logStatus.error} ${pagePath.credential.list}`, e.message);

    throw new Error(errors.response500.message);
  } finally {
    loggerInfo(logEndForPageSSR(pagePath.credential.list));
  }
  return {
    props: {
      isCreatedWallet: true,
    }
  }
  */
};

const Home: NextPage<Props> = ({ isCreatedWallet }) => {
  const router = useRouter();

  useEffect(() => {
    if (!isCreatedWallet) {
      router.push(pagePath.entry);
    }
  }, []);

  if (!isCreatedWallet) return null;

  return (
    <>
    { /*
    <Layout maxW="xl">
      <></>

      <Metatag title={SERVICE_NAME} description={SERVICE_DESCRITION} />
      <PageTitle title={pageName.credential.list} />

      <WaletVCList />
      
    </Layout>
    */}
    </>
  );
};

export default Home;
