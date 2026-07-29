"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildSharePayload,
  buildSiteSharePayload,
  deliverShare,
  type ShareResult,
} from "@/lib/share";
import { trackAnalyticsEvent } from "@/lib/analytics";
import type { ShiftId } from "@/game/cast";
import type { PieceId } from "@/game";

type ShareSurface = "hero" | "game" | "completion" | "lawsuit";

export function ShareChallengeButton({
  className = "",
  label = "SHARE GAME",
  mode = "site",
  elapsedMs,
  firedPieceId,
  moves = 0,
  result = "completed",
  score = 0,
  showCopyFallback = false,
  shiftId,
  surface,
}: {
  className?: string;
  label?: string;
  mode?: "site" | "challenge";
  elapsedMs?: number;
  firedPieceId?: PieceId;
  moves?: number;
  result?: ShareResult;
  score?: number;
  showCopyFallback?: boolean;
  shiftId?: ShiftId;
  surface: ShareSurface;
}) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => setFeedback(null), 3_600);
  };

  const shareChallenge = async (copyOnly = false) => {
    if (busy) return;
    setBusy(true);
    setManualUrl(null);

    const payload = mode === "challenge"
      ? buildSharePayload({
          elapsedMs,
          firedPieceId,
          moves,
          origin: window.location.origin,
          result,
          score,
          shiftId,
        })
      : buildSiteSharePayload(window.location.origin);
    const delivery = await deliverShare(payload, {
      nativeShare:
        !copyOnly && typeof navigator.share === "function"
          ? (sharePayload) => navigator.share(sharePayload)
          : undefined,
      writeClipboard:
        typeof navigator.clipboard?.writeText === "function"
          ? (value) => navigator.clipboard.writeText(value)
          : undefined,
    });

    trackAnalyticsEvent("share_selected", {
      level_id: "mandatory-elevator-meeting",
      method: delivery.method,
      outcome: delivery.outcome,
      shift_id: shiftId,
      surface,
    });

    if (delivery.outcome === "shared") showFeedback("Share completed. Management is now their problem.");
    if (delivery.outcome === "copied") showFeedback(mode === "challenge" ? "Challenge link copied." : "Game link copied.");
    if (delivery.outcome === "canceled") showFeedback("Share canceled. Your coworkers remain safe—for now.");
    if (delivery.outcome === "manual") {
      setManualUrl(delivery.manualUrl);
      setFeedback(mode === "challenge" ? "Copy this challenge link:" : "Copy this game link:");
    }
    setBusy(false);
  };

  return (
    <span className={`share-challenge-button__wrap ${className}`.trim()}>
      <button
        className="share-challenge-button"
        data-testid={`share-${surface}`}
        disabled={busy}
        onClick={() => void shareChallenge(false)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="share-challenge-button__icon"
          viewBox="0 0 24 24"
        >
          <circle cx="5" cy="12" r="2.4" />
          <circle cx="18.5" cy="5.5" r="2.4" />
          <circle cx="18.5" cy="18.5" r="2.4" />
          <path d="m7.2 10.9 9-4.3M7.2 13.1l9 4.3" />
        </svg>
        {busy ? "OPENING SHARE…" : label}
      </button>
      {showCopyFallback ? (
        <button
          aria-label="Copy challenge link"
          className="share-challenge-button__copy"
          data-testid={`copy-${surface}`}
          disabled={busy}
          onClick={() => void shareChallenge(true)}
          type="button"
        >
          COPY LINK
        </button>
      ) : null}
      {feedback || manualUrl ? (
        <span
          aria-live="polite"
          className="share-challenge-button__feedback"
          data-testid={`share-feedback-${surface}`}
          role="status"
        >
          {feedback}
          {manualUrl ? (
            <input
              aria-label="Manual challenge link"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={manualUrl}
            />
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
