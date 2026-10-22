"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLastTab, hasCompletedFirstRun } from "@/native/store/appPrefs";

export default function MobileRootPage() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const firstRunDone = await hasCompletedFirstRun();
      if (firstRunDone) {
        const lastTab = await getLastTab("home");
        const targetRoute = lastTab.startsWith("/") ? lastTab : `/${lastTab}`;
        router.replace(targetRoute);
      } else {
        router.replace("/m/launch");
      }
    })();
  }, [router]);

  return null;
}
