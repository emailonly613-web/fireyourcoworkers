"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

export function AnalyticsPageView() {
  useEffect(() => {
    trackAnalyticsEvent("page_view", { surface: "home" });
  }, []);

  return null;
}
