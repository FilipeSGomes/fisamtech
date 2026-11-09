"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/routing";
import { track } from "@/lib/analytics";

export function AnalyticsListener() {
  const pathname = usePathname();
  useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);
  return null;
}
