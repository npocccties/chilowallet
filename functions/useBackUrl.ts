import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const fallbackBackUrl = process.env.NEXT_PUBLIC_BACK_URL as string;
const STORAGE_KEY = "back_url";
const EXCEPTION_PATHS = ["/credential/detail"]

export const useBackUrl = (): string => {
  const router = useRouter();
  const raw = router.query.back_url;
  const [storedUrl, setStoredUrl] = useState<string | null>(null);

  useEffect(() => {
    // back_urlを指定されないページにおいて、他のページで指定された情報を参照しないよう、削除する。
    if (!raw) {
      for (const ep of EXCEPTION_PATHS) {
        if (router.pathname.includes(ep)) {
          console.debug("not use back_url page")
          sessionStorage.removeItem(STORAGE_KEY);
          setStoredUrl(null);
          return;
        }
      }
    }
    console.debug("use back_url page")
    if (raw && !Array.isArray(raw)) {
      try {
        const decoded = decodeURIComponent(raw);
        sessionStorage.setItem(STORAGE_KEY, decoded);
        setStoredUrl(decoded);
      } catch {
        setStoredUrl(null);
      }
    } else {
      const fromStorage = sessionStorage.getItem(STORAGE_KEY);
      setStoredUrl(fromStorage);
    }
  }, [raw]);

  return storedUrl || fallbackBackUrl;
}
