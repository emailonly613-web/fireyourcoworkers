"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { PIECE_IDS, type PieceId } from "@/game";
import type { ShiftDefinition } from "@/game/cast";
import type { RunVerdict } from "@/game/results";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { buildSharePayload } from "@/lib/share";

type PerformanceReviewActionsProps = {
  boardRef: RefObject<HTMLDivElement | null>;
  moves: number;
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

  roundedRect(context, 54, 294, 972, 470, 30);
  context.fillStyle = "rgba(2, 10, 17, .84)";
  context.fill();
  context.strokeStyle = verdict.tone === "legal" ? "#f0443f" : "#73de42";
  context.lineWidth = 8;
  context.stroke();

  context.fillStyle = verdict.tone === "legal" ? "#f0443f" : "#73de42";
  context.font = "900 28px Arial, sans-serif";
  context.fillText(verdict.tone === "legal" ? "FINAL NOTICE" : "MANAGEMENT ARCHETYPE", 92, 362);
  context.fillStyle = "#ffffff";
  context.font = "900 77px Arial, sans-serif";
  const verdictBottom = drawWrappedText(context, verdict.title, 92, 458, 890, 78, 3);
  context.fillStyle = "#ffcf3f";
  context.font = "900 29px Arial, sans-serif";
  context.fillText(verdict.kicker, 92, Math.max(670, verdictBottom + 42));

  context.fillStyle = "#f6f0df";
  context.font = "900 28px Arial, sans-serif";
  context.fillText("TODAY'S MANDATORY ATTENDEES", 72, 840);

  const panelWidth = 292;
  const panelGap = 24;
  const castImages = await Promise.all(
    PIECE_IDS.map(async (pieceId) => {
      const svg = board.querySelector<SVGElement>(`[data-testid="placed-${pieceId}"] svg`);
      return svg ? svgToImage(svg) : null;
    }),
  );

  PIECE_IDS.forEach((pieceId: PieceId, index) => {
    const x = 72 + index * (panelWidth + panelGap);
    roundedRect(context, x, 878, panelWidth, 402, 24);
    context.fillStyle = index === 1 ? "#18344a" : "#102736";
    context.fill();
    context.strokeStyle = "rgba(162, 207, 232, .42)";
    context.lineWidth = 3;
    context.stroke();

    const image = castImages[index];
    if (image) context.drawImage(image, x + 17, 914, panelWidth - 34, 230);

    const member = shift.cast[pieceId];
    context.fillStyle = "#ffcf3f";
    context.font = "900 17px Arial, sans-serif";
    context.fillText(`0${index + 1}`, x + 19, 1177);
    context.fillStyle = "#ffffff";
    context.font = "900 24px Arial, sans-serif";
    drawWrappedText(context, member.publicName.toUpperCase(), x + 19, 1214, panelWidth - 38, 27, 2);
  });

  roundedRect(context, 72, 1330, 446, 172, 24);
  context.fillStyle = "#ffcf3f";
  context.fill();
  context.fillStyle = "#06111b";
  context.font = "900 25px Arial, sans-serif";
  context.fillText("HR EXPOSURE", 104, 1382);
  context.font = "900 72px Arial, sans-serif";
  context.fillText(`${score}%`, 104, 1470);

  roundedRect(context, 562, 1330, 446, 172, 24);
  context.fillStyle = "#f0443f";
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "900 25px Arial, sans-serif";
  context.fillText("MOVES FILED", 594, 1382);
  context.font = "900 72px Arial, sans-serif";
  context.fillText(String(moves), 594, 1470);

  context.fillStyle = "#f6f0df";
  context.font = "700 37px Arial, sans-serif";
  drawWrappedText(context, verdict.caption, 72, 1590, 934, 48, 3);

  context.fillStyle = "#73de42";
  context.font = "900 28px Arial, sans-serif";
  context.fillText("CAN YOUR COWORKER BEAT THIS?", 72, 1776);
  context.fillStyle = "#ffffff";
  context.font = "900 34px Arial, sans-serif";
  context.fillText("FIREYOURCOWORKERS.COM", 72, 1830);
  context.fillStyle = "#8fa4b2";
  context.font = "700 20px Arial, sans-serif";
  context.fillText("PACK THE OFFICE · SURVIVE HR · SHARE THE PAPERWORK", 72, 1873);

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
  moves,
  score,
  shift,
  verdict,
}: PerformanceReviewActionsProps) {
  const [busy, setBusy] = useState<"share" | "save" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
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
    return renderCard(boardRef.current, shift, verdict, score, moves);
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
        showFeedback("Card saved and challenge link copied.");
        return;
      } catch {
        // The visible challenge button remains available as a manual-copy fallback.
      }
    }
    trackReviewShare("manual", "manual");
    showFeedback("Card saved. Use Challenge a Coworker to copy the link.");
  };

  const saveCard = async () => {
    if (busy) return;
    setBusy("save");
    try {
      const blob = await createCard();
      downloadBlob(blob, `fire-your-coworkers-${verdict.id}.png`);
      showFeedback("9:16 performance review saved.");
    } catch {
      showFeedback("The card could not be saved in this browser.");
    } finally {
      setBusy(null);
    }
  };

  const shareCard = async () => {
    if (busy) return;
    setBusy("share");
    try {
      const blob = await createCard();
      const payload = buildSharePayload({
        moves,
        origin: window.location.origin,
        result: "completed",
        score,
        shiftId: shift.id,
      });
      const file = new File([blob], `fire-your-coworkers-${verdict.id}.png`, {
        type: "image/png",
      });
      const canShareFile = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

      if (typeof navigator.share === "function" && canShareFile) {
        try {
          await navigator.share({ ...payload, files: [file] });
          trackReviewShare("web_share", "shared");
          showFeedback("Performance review shared.");
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
        {busy === "share" ? "BUILDING CARD…" : "SHARE 9:16 REVIEW"}
      </button>
      <button
        data-testid="save-review-card"
        disabled={busy !== null}
        onClick={() => void saveCard()}
        type="button"
      >
        {busy === "save" ? "SAVING…" : "SAVE CARD"}
      </button>
      {feedback ? <p aria-live="polite" role="status">{feedback}</p> : null}
    </div>
  );
}
