"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { PieceId } from "@/game";
import type { ShiftDefinition } from "@/game/cast";
import type { RunVerdict } from "@/game/results";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { buildSharePayload } from "@/lib/share";

type PerformanceReviewActionsProps = {
  boardRef: RefObject<HTMLDivElement | null>;
  elapsedMs: number;
  firedPieceId: PieceId;
  moves: number;
  primaryLabel: string;
  score: number;
  shift: ShiftDefinition;
  verdict: RunVerdict;
};

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

async function svgToImage(svg: SVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "720");
  clone.setAttribute("height", "500");
  const markup = new XMLSerializer().serializeToString(clone);
  const objectUrl = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function renderCard(
  board: HTMLDivElement,
  shift: ShiftDefinition,
  verdict: RunVerdict,
  score: number,
  moves: number,
  elapsedMs: number,
  firedPieceId: PieceId,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, "#06111b");
  background.addColorStop(0.5, "#102b3c");
  background.addColorStop(1, "#03090f");
  context.fillStyle = background;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.save();
  context.globalAlpha = 0.12;
  context.strokeStyle = "#91cbe8";
  context.lineWidth = 3;
  for (let x = -CARD_HEIGHT; x < CARD_WIDTH + CARD_HEIGHT; x += 74) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + CARD_HEIGHT, CARD_HEIGHT);
    context.stroke();
  }
  context.restore();

  context.fillStyle = "#f6f0df";
  context.font = "900 64px Arial, sans-serif";
  context.fillText("FIRE YOUR", 72, 118);
  context.fillStyle = "#f0443f";
  context.fillText("COWORKERS", 414, 118);
  context.strokeStyle = "#f0443f";
  context.lineWidth = 7;
  context.strokeRect(398, 53, 620, 88);

  context.fillStyle = "#ffcf3f";
  context.font = "900 25px Arial, sans-serif";
  context.fillText("CONFIDENTIAL · FLOOR 01 · PERFORMANCE REVIEW", 72, 205);
  context.fillStyle = "#9eb3c0";
  context.font = "700 25px Arial, sans-serif";
  context.fillText(shift.title.toUpperCase(), 72, 249);

  const firedMember = shift.cast[firedPieceId];

  roundedRect(context, 54, 294, 972, 486, 30);
  context.fillStyle = "rgba(2, 10, 17, .84)";
  context.fill();
  context.strokeStyle = "#f0443f";
  context.lineWidth = 8;
  context.stroke();

  context.fillStyle = "#f0443f";
  context.font = "900 28px Arial, sans-serif";
  context.fillText("TERMINATION NOTICE", 92, 362);
  context.fillStyle = "#ffffff";
  context.font = "900 58px Arial, sans-serif";
  context.fillText("I FIRED THE", 92, 446);
  context.font = "900 76px Arial, sans-serif";
  const firedTitleBottom = drawWrappedText(
    context,
    firedMember.shortName.toUpperCase(),
    92,
    536,
    890,
    78,
    2,
  );
  context.fillStyle = "#ffcf3f";
  context.font = "900 27px Arial, sans-serif";
  context.fillText(verdict.kicker, 92, Math.min(734, firedTitleBottom + 48));

  roundedRect(context, 72, 830, 936, 450, 26);
  context.fillStyle = "#102736";
  context.fill();
  context.strokeStyle = "rgba(162, 207, 232, .42)";
  context.lineWidth = 3;
  context.stroke();

  const firedSvg = board.querySelector<SVGElement>(`[data-testid="placed-${firedPieceId}"] svg`);
  const firedImage = firedSvg ? await svgToImage(firedSvg) : null;
  if (firedImage) context.drawImage(firedImage, 86, 866, 474, 330);

  context.save();
  context.translate(325, 1070);
  context.rotate(-0.17);
  context.fillStyle = "rgba(128, 10, 17, .93)";
  context.fillRect(-142, -55, 284, 110);
  context.strokeStyle = "#ff665c";
  context.lineWidth = 8;
  context.strokeRect(-142, -55, 284, 110);
  context.fillStyle = "#ffffff";
  context.font = "900 68px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("FIRED", 0, 25);
  context.restore();

  context.fillStyle = "#f0443f";
  context.font = "900 22px Arial, sans-serif";
  context.fillText("CAUSE", 590, 894);
  context.fillStyle = "#ffffff";
  context.font = "900 35px Arial, sans-serif";
  const causeBottom = drawWrappedText(context, firedMember.terminationReason, 590, 946, 366, 42, 3);
  context.fillStyle = "#ffcf3f";
  context.font = "900 20px Arial, sans-serif";
  context.fillText("MANAGEMENT ARCHETYPE", 590, Math.max(1110, causeBottom + 54));
  context.fillStyle = "#ffffff";
  context.font = "900 29px Arial, sans-serif";
  drawWrappedText(context, verdict.title, 590, Math.max(1154, causeBottom + 98), 366, 34, 3);

  const metricWidth = 296;
  const metricGap = 24;
  const metricY = 1330;
  const drawMetric = (x: number, fill: string, label: string, value: string) => {
    roundedRect(context, x, metricY, metricWidth, 170, 24);
    context.fillStyle = fill;
    context.fill();
    context.fillStyle = fill === "#ffcf3f" ? "#06111b" : "#ffffff";
    context.font = "900 23px Arial, sans-serif";
    context.fillText(label, x + 26, metricY + 51);
    context.font = "900 59px Arial, sans-serif";
    context.fillText(value, x + 26, metricY + 133);
  };

  drawMetric(72, "#ffcf3f", "HR EXPOSURE", `${score}%`);
  drawMetric(72 + metricWidth + metricGap, "#f0443f", "MOVES FILED", String(moves));
  drawMetric(72 + (metricWidth + metricGap) * 2, "#245f88", "ELAPSED", `${(elapsedMs / 1_000).toFixed(1)}s`);

  context.fillStyle = "#f6f0df";
  context.font = "700 36px Arial, sans-serif";
  drawWrappedText(context, firedMember.terminationLine, 72, 1584, 934, 46, 2);
  context.fillStyle = "#9eb3c0";
  context.font = "700 28px Arial, sans-serif";
  drawWrappedText(context, verdict.caption, 72, 1690, 934, 38, 2);

  context.fillStyle = "#73de42";
  context.font = "900 30px Arial, sans-serif";
  context.fillText("THINK I BLAMED THE WRONG COWORKER?", 72, 1800);
  context.fillStyle = "#ffffff";
  context.font = "900 38px Arial, sans-serif";
  context.fillText("FIREYOURCOWORKERS.COM", 72, 1852);
  context.fillStyle = "#8fa4b2";
  context.font = "700 20px Arial, sans-serif";
  context.fillText("TAKE THE SAME SHIFT · OVERTURN THE FIRING", 72, 1892);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Could not create the review card.")),
      "image/png",
      0.94,
    );
  });
}

export function PerformanceReviewActions({
  boardRef,
  elapsedMs,
  firedPieceId,
  moves,
  primaryLabel,
  score,
  shift,
  verdict,
}: PerformanceReviewActionsProps) {
  const [busy, setBusy] = useState<"share" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 4_200);
  };

  const createCard = async () => {
    if (!boardRef.current) throw new Error("The completed elevator is unavailable.");
    return renderCard(boardRef.current, shift, verdict, score, moves, elapsedMs, firedPieceId);
  };

  const trackReviewShare = (
    method: "web_share" | "clipboard" | "manual",
    outcome: "shared" | "copied" | "canceled" | "manual",
  ) => {
    trackAnalyticsEvent("share_selected", {
      level_id: "mandatory-elevator-meeting",
      method,
      outcome,
      shift_id: shift.id,
      surface: "completion",
    });
  };

  const saveAndCopyFallback = async (blob: Blob, filename: string, challengeUrl: string) => {
    downloadBlob(blob, filename);
    if (typeof navigator.clipboard?.writeText === "function") {
      try {
        await navigator.clipboard.writeText(challengeUrl);
        trackReviewShare("clipboard", "copied");
        showFeedback("Termination notice saved and challenge link copied.");
        return;
      } catch {
        // The browser may still expose the downloaded card for manual sharing.
      }
    }
    trackReviewShare("manual", "manual");
    setManualUrl(challengeUrl);
    showFeedback("Notice saved. Your exact challenge link is ready below.");
  };

  const shareCard = async () => {
    if (busy) return;
    setBusy("share");
    setManualUrl(null);
    try {
      const blob = await createCard();
      const payload = buildSharePayload({
        elapsedMs,
        firedPieceId,
        moves,
        origin: window.location.origin,
        result: "completed",
        score,
        shiftId: shift.id,
      });
      const file = new File([blob], `fire-your-coworkers-fired-${firedPieceId}.png`, {
        type: "image/png",
      });
      const canShareFile = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

      if (typeof navigator.share === "function" && canShareFile) {
        try {
          await navigator.share({ ...payload, files: [file] });
          trackReviewShare("web_share", "shared");
          showFeedback("Termination notice shared. The appeal is now their problem.");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            trackReviewShare("web_share", "canceled");
            showFeedback("Share canceled. The review remains confidential.");
          } else {
            await saveAndCopyFallback(blob, file.name, payload.url);
          }
        }
      } else {
        await saveAndCopyFallback(blob, file.name, payload.url);
      }
    } catch {
      showFeedback("The card could not be shared in this browser.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="performance-review-actions">
      <button
        data-testid="share-review-card"
        disabled={busy !== null}
        onClick={() => void shareCard()}
        type="button"
      >
        {busy === "share" ? "BUILDING NOTICE…" : primaryLabel}
      </button>
      {feedback ? <p aria-live="polite" role="status">{feedback}</p> : null}
      {manualUrl ? (
        <label className="performance-review-actions__manual">
          <span>EXACT CHALLENGE LINK · TAP TO SELECT</span>
          <input
            aria-label="Exact challenge link"
            onClick={(event) => event.currentTarget.select()}
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            value={manualUrl}
          />
        </label>
      ) : null}
    </div>
  );
}
