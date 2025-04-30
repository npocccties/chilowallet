import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const fallbackBackUrl = process.env.NEXT_PUBLIC_BACK_URL as string;
const STORAGE_KEY = "back_url";

export const useBackUrl = (): string => {
  const router = useRouter();
  const raw = router.query.back_url;
  const [storedUrl, setStoredUrl] = useState<string | null>(null);

  useEffect(() => {
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