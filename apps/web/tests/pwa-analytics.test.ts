import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import manifest, { PWA_ASSET_GAPS } from "../app/manifest";
import {
  ANALYTICS_EVENT_NAMES,
  addAnalyticsSink,
  clearBufferedAnalyticsEvents,
  getBufferedAnalyticsEvents,
  trackAnalyticsEvent,
} from "../lib/analytics";

const here = dirname(fileURLToPath(import.meta.url));
const serviceWorkerSource = readFileSync(resolve(here, "../public/sw.js"), "utf8");
const registrationSource = readFileSync(
  resolve(here, "../components/PwaRegistration.tsx"),
  "utf8",
);
const installControlSource = readFileSync(
  resolve(here, "../components/InstallControl.tsx"),
  "utf8",
);
const siteSectionsSource = readFileSync(
  resolve(here, "../components/site/SiteSections.tsx"),
  "utf8",
);
const prohibitedPublicMarks = ["corporate " + "tetris", "tetri" + "mino"];

describe("PWA foundation", () => {
  it("publishes truthful standalone metadata under the public brand", () => {
    const value = manifest();

    expect(value).toMatchObject({
      id: "/",
      name: "Fire Your Coworkers",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "any",
      theme_color: "#07111d",
    });
    expect(value.screenshots).toEqual(expect.arrayContaining([
      expect.objectContaining({
        src: "/art/elevator-atrium-v1.png",
        sizes: "1672x941",
        form_factor: "wide",
      }),
      expect.objectContaining({
        src: "/screenshots/gameplay-mobile-390x844.png",
        sizes: "390x844",
        form_factor: "narrow",
      }),
    ]));
  });

  it("publishes dedicated square and maskable install icons", () => {
    expect(manifest().icons).toEqual([
      expect.objectContaining({
        src: "/icons/app-icon-192.png",
        sizes: "192x192",
        purpose: "any",
      }),
      expect.objectContaining({
        src: "/icons/app-icon-512.png",
        sizes: "512x512",
        purpose: "any",
      }),
      expect.objectContaining({
        src: "/icons/app-icon-maskable-512.png",
        sizes: "512x512",
        purpose: "maskable",
      }),
    ]);
    for (const icon of manifest().icons ?? []) {
      expect(existsSync(resolve(here, `../public${icon.src}`))).toBe(true);
    }
    expect(PWA_ASSET_GAPS.join(" ")).not.toContain("192x192");
    expect(PWA_ASSET_GAPS.join(" ")).not.toContain("maskable");
  });

  it("uses a versioned, same-origin shell with network-first navigation", () => {
    expect(serviceWorkerSource).toContain('CACHE_NAMESPACE = "fire-your-coworkers"');
    expect(serviceWorkerSource).toContain('CACHE_VERSION = "shell-v1"');
    expect(serviceWorkerSource).toContain("url.origin === self.location.origin");
    expect(serviceWorkerSource).toContain('request.mode === "navigate"');
    expect(serviceWorkerSource).toContain('cache.match("/")');
    expect(serviceWorkerSource).toContain("caches.delete(key)");
    expect(serviceWorkerSource).toContain('event.data?.type === "SKIP_WAITING"');
  });

  it("registers the worker and handles waiting-worker activation", () => {
    expect(registrationSource).toContain('SERVICE_WORKER_PATH = "/sw.js"');
    expect(registrationSource).toContain('updateViaCache: "none"');
    expect(registrationSource).toContain('"controllerchange"');
    expect(registrationSource).toContain('"updatefound"');
    expect(registrationSource).toContain('type: "SKIP_WAITING"');
  });

  it("only exposes the install label after capturing the real browser prompt", () => {
    expect(installControlSource).toContain('"beforeinstallprompt"');
    expect(installControlSource).toContain("installEvent.preventDefault()");
    expect(installControlSource).toContain('setMode("prompt-ready")');
    expect(installControlSource).toContain('mode === "prompt-ready"');
    expect(installControlSource).toContain('? "Install app"');
    expect(installControlSource).toContain("await deferredPrompt.prompt()");
    expect(installControlSource).not.toContain("useEffect(() => deferredPrompt?.prompt");
  });

  it("keeps the install section server-rendered and embeds one client control", () => {
    expect(siteSectionsSource).not.toContain('"use client"');
    expect(siteSectionsSource).toContain('aria-labelledby="install-title"');
    expect(siteSectionsSource).toContain('id="install-title"');
    expect(siteSectionsSource).toContain("<InstallControl />");
    expect(siteSectionsSource).toContain("Play in the browser");
  });

  it("tracks prompt, guidance, and unavailable selections distinctly", () => {
    expect(installControlSource).toContain('result: "prompted"');
    expect(installControlSource).toContain('result: "instructions"');
    expect(installControlSource).toContain('result: "unavailable"');
    expect(installControlSource).toContain("INSTALL_GUIDANCE");
  });

  it("keeps prohibited historical naming out of public PWA files", () => {
    const publicText = [
      JSON.stringify(manifest()),
      serviceWorkerSource,
      registrationSource,
      installControlSource,
      siteSectionsSource,
    ]
      .join("\n")
      .toLowerCase();

    for (const mark of prohibitedPublicMarks) expect(publicText).not.toContain(mark);
  });
});

describe("anonymous analytics adapter", () => {
  const analyticsGlobal = globalThis as typeof globalThis & {
    dataLayer?: Array<Record<string, unknown>>;
  };

  beforeEach(() => {
    clearBufferedAnalyticsEvents();
    analyticsGlobal.dataLayer = [];
  });

  afterEach(() => {
    delete analyticsGlobal.dataLayer;
  });

  it("supports exactly the approved event vocabulary", () => {
    expect(ANALYTICS_EVENT_NAMES).toEqual([
      "page_view",
      "play_started",
      "first_piece_grabbed",
      "valid_drop",
      "invalid_drop",
      "level_completed",
      "lawsuit_triggered",
      "replay_viewed",
      "install_cta_selected",
      "share_selected",
      "challenge_opened",
      "challenge_completed",
    ]);
  });

  it("records in memory and mirrors an existing dataLayer without a network call", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const sink = vi.fn();
    const removeSink = addAnalyticsSink(sink);

    const record = trackAnalyticsEvent("valid_drop", {
      level_id: "floor_001",
      piece_id: "sleeping_intern",
      move_number: 2,
    });

    expect(record?.properties).toEqual({
      level_id: "floor_001",
      piece_id: "sleeping_intern",
      move_number: 2,
    });
    expect(getBufferedAnalyticsEvents()).toHaveLength(1);
    expect(analyticsGlobal.dataLayer).toEqual([
      {
        event: "valid_drop",
        level_id: "floor_001",
        piece_id: "sleeping_intern",
        move_number: 2,
        fyc_schema_version: 1,
      },
    ]);
    expect(sink).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();

    removeSink();
    fetchSpy.mockRestore();
  });

  it("drops undeclared properties and identifier values that resemble personal data", () => {
    const record = trackAnalyticsEvent(
      "first_piece_grabbed",
      {
        level_id: "floor_001",
        piece_id: "person@example.com",
        email: "person@example.com",
        display_name: "A Person",
      } as never,
    );

    expect(record?.properties).toEqual({ level_id: "floor_001" });
    expect(JSON.stringify(record)).not.toContain("person@example.com");
    expect(JSON.stringify(record)).not.toContain("A Person");
  });

  it("normalizes safe identifiers and clamps numeric measurements", () => {
    const record = trackAnalyticsEvent("level_completed", {
      level_id: " FLOOR_030 ",
      move_count: -4,
      elapsed_ms: Number.POSITIVE_INFINITY,
      score: 2_000_000_000,
      shift_id: " AFTER-HOURS-ENGINEERING ",
    });

    expect(record?.properties).toEqual({
      level_id: "floor_030",
      move_count: 0,
      score: 1_000_000_000,
      shift_id: "after-hours-engineering",
    });
  });

  it("does not let an optional sink failure interrupt gameplay", () => {
    const removeSink = addAnalyticsSink(() => {
      throw new Error("development sink unavailable");
    });

    expect(() =>
      trackAnalyticsEvent("page_view", { surface: "home" }),
    ).not.toThrow();
    expect(getBufferedAnalyticsEvents()).toHaveLength(1);

    removeSink();
  });
});
