"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

export function ReplayAnalytics() {
  useEffect(() => {
    const replay = document.querySelector("#replays");
    if (!replay || !("IntersectionObserver" in window)) return;

    let tracked = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (tracked || !entries.some((entry) => entry.isIntersecting)) return;
        tracked = true;
        trackAnalyticsEvent("replay_viewed", {
          level_id: "mandatory-elevator-meeting",
          source: "highlight",
        });
        observer.disconnect();
      },
      { threshold: 0.45 },
    );
    observer.observe(replay);
    return () => observer.disconnect();
  }, []);

  return null;
}
