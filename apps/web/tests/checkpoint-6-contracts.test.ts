import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, Script } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import manifest from "../app/manifest";
import {
  ANALYTICS_EVENT_NAMES,
  clearBufferedAnalyticsEvents,
  getBufferedAnalyticsEvents,
  trackAnalyticsEvent,
} from "../lib/analytics";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const publicRoot = resolve(webRoot, "public");
const screenshotRoot = resolve(
  webRoot,
  "../../proof/24-hour-preview/screenshots",
);
const serviceWorkerPath = resolve(publicRoot, "sw.js");
const serviceWorkerSource = readFileSync(serviceWorkerPath, "utf8");
const rootLayoutSource = readFileSync(resolve(webRoot, "app/layout.tsx"), "utf8");
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngDimensions(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.length, `${path} must not be an empty placeholder`).toBeGreaterThan(1024);
  expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `${path} must be a real PNG`).toBe(true);
  expect(bytes.toString("ascii", 12, 16), `${path} must start with an IHDR chunk`).toBe(
    "IHDR",
  );
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function imageDimensions(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.length, `${path} must not be an empty placeholder`).toBeGreaterThan(1024);
  if (bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1] ?? 0;
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const segmentLength = bytes.readUInt16BE(offset + 2);
      const isStartOfFrame =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isStartOfFrame) {
        return {
          width: bytes.readUInt16BE(offset + 7),
          height: bytes.readUInt16BE(offset + 5),
        };
      }
      offset += 2 + segmentLength;
    }
  }

  throw new TypeError(`${path} is not a supported screenshot image.`);
}

function allFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    return entry.isDirectory() ? allFiles(path) : [path];
  });
}

type ServiceWorkerEvent = {
  data?: { type?: string };
  ports?: { postMessage: (value: unknown) => void }[];
  preloadResponse?: Promise<Response | undefined>;
  request?: Request;
  waitUntil?: (promise: Promise<unknown>) => void;
};

function serviceWorkerHarness(options: { cacheRoot?: Response } = {}) {
  const listeners = new Map<string, (event: ServiceWorkerEvent) => void>();
  const deletedCaches: string[] = [];
  const cache = {
    match: vi.fn(async (request: Request | string) => {
      const target = typeof request === "string" ? request : new URL(request.url).pathname;
      return target === "/" ? options.cacheRoot : undefined;
    }),
    put: vi.fn(async () => undefined),
  };
  const fetchMock = vi.fn(async () => {
    throw new TypeError("offline");
  });
  const skipWaiting = vi.fn(async () => undefined);
  const claim = vi.fn(async () => undefined);

  const sandbox: Record<string, unknown> = {
    URL,
    Request,
    Response,
    Set,
    Promise,
    fetch: fetchMock,
    caches: {
      open: vi.fn(async () => cache),
      keys: vi.fn(async () => [
        "fire-your-coworkers-shell-v0",
        "fire-your-coworkers-shell-v1",
        "unrelated-cache",
      ]),
      delete: vi.fn(async (key: string) => {
        deletedCaches.push(key);
        return true;
      }),
    },
  };
  sandbox.self = {
    location: { origin: "https://fireyourcoworkers.com" },
    addEventListener: (name: string, listener: (event: ServiceWorkerEvent) => void) => {
      listeners.set(name, listener);
    },
    clients: { claim },
    registration: { navigationPreload: { enable: vi.fn(async () => undefined) } },
    skipWaiting,
  };

  new Script(serviceWorkerSource, { filename: serviceWorkerPath }).runInContext(
    createContext(sandbox),
  );

  return {
    cache,
    claim,
    deletedCaches,
    fetchMock,
    listeners,
    networkFirstNavigation: sandbox.networkFirstNavigation as (event: {
      preloadResponse: Promise<Response | undefined>;
      request: Request;
    }) => Promise<Response>,
    skipWaiting,
  };
}

describe("Checkpoint 6 PWA and metadata contracts", () => {
  it("backs every manifest icon with a correctly sized PNG file", () => {
    const icons = manifest().icons ?? [];
    expect(icons).toHaveLength(3);

    for (const icon of icons) {
      expect(icon.type).toBe("image/png");
      const declared = String(icon.sizes).match(/^(\d+)x(\d+)$/);
      expect(declared, `${icon.src} must declare one exact square size`).not.toBeNull();
      const path = resolve(publicRoot, String(icon.src).replace(/^\//, ""));
      expect(pngDimensions(path)).toEqual({
        width: Number(declared?.[1]),
        height: Number(declared?.[2]),
      });
    }

    expect(icons.some(({ purpose }) => String(purpose).includes("maskable"))).toBe(true);
  });

  it("backs every declared PNG install screenshot with matching PNG bytes", () => {
    const screenshots = manifest().screenshots ?? [];
    expect(screenshots.length).toBeGreaterThanOrEqual(2);
    for (const screenshot of screenshots) {
      expect(screenshot.type).toBe("image/png");
      const declared = String(screenshot.sizes).match(/^(\d+)x(\d+)$/);
      expect(declared, `${screenshot.src} must declare exact dimensions`).not.toBeNull();
      const path = resolve(publicRoot, String(screenshot.src).replace(/^\//, ""));
      expect(pngDimensions(path)).toEqual({
        width: Number(declared?.[1]),
        height: Number(declared?.[2]),
      });
    }
  });

  it("parses the service worker and preserves cache/update contracts", async () => {
    expect(() => new Script(serviceWorkerSource, { filename: serviceWorkerPath })).not.toThrow();
    const harness = serviceWorkerHarness();
    let activation: Promise<unknown> | undefined;
    harness.listeners.get("activate")?.({ waitUntil: (promise) => { activation = promise; } });
    await activation;

    expect(harness.deletedCaches).toEqual(["fire-your-coworkers-shell-v0"]);
    expect(harness.claim).toHaveBeenCalledOnce();

    let update: Promise<unknown> | undefined;
    harness.listeners.get("message")?.({
      data: { type: "SKIP_WAITING" },
      waitUntil: (promise) => { update = promise; },
    });
    await update;
    expect(harness.skipWaiting).toHaveBeenCalledOnce();
  });

  it("returns the cached starter shell, then a branded 503 fallback, while offline", async () => {
    const cachedShell = new Response("cached starter shell", { status: 200 });
    const cachedHarness = serviceWorkerHarness({ cacheRoot: cachedShell });
    const request = new Request("https://fireyourcoworkers.com/missing", {
      headers: { Accept: "text/html" },
    });
    const cachedResponse = await cachedHarness.networkFirstNavigation({
      preloadResponse: Promise.resolve(undefined),
      request,
    });
    expect(await cachedResponse.text()).toBe("cached starter shell");
    expect(cachedHarness.fetchMock).toHaveBeenCalledOnce();

    const fallbackHarness = serviceWorkerHarness();
    const fallback = await fallbackHarness.networkFirstNavigation({
      preloadResponse: Promise.resolve(undefined),
      request,
    });
    expect(fallback.status).toBe(503);
    expect(await fallback.text()).toContain("Fire Your Coworkers");
  });

  it("points root metadata at a real 1200x630 Open Graph PNG", () => {
    expect(rootLayoutSource).toContain("export const metadata");
    expect(rootLayoutSource).toContain("openGraph:");
    const imageDeclaration = rootLayoutSource.match(
      /url:\s*["'](\/social\/[^"']+)["']\s*,\s*width:\s*1200\s*,\s*height:\s*630/,
    );
    expect(imageDeclaration, "root Open Graph metadata must declare the launch image").not.toBeNull();
    expect(imageDeclaration?.[1]).toBe("/social/og-preview-1200x630.png");
    const path = resolve(publicRoot, String(imageDeclaration?.[1]).replace(/^\//, ""));
    expect(pngDimensions(path)).toEqual({ width: 1200, height: 630 });
  });
});

describe("Checkpoint 6 anonymous analytics contract", () => {
  const analyticsGlobal = globalThis as typeof globalThis & {
    dataLayer?: Array<Record<string, unknown>>;
  };

  beforeEach(() => {
    clearBufferedAnalyticsEvents();
    analyticsGlobal.dataLayer = [];
  });

  afterEach(() => {
    delete analyticsGlobal.dataLayer;
    vi.restoreAllMocks();
  });

  it("emits and sanitizes all nine approved events without a network request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    trackAnalyticsEvent("page_view", { surface: "home" });
    trackAnalyticsEvent("play_started", { level_id: " FLOOR_001 ", source: "hero" });
    trackAnalyticsEvent("first_piece_grabbed", {
      level_id: "floor_001",
      piece_id: "micro-managing-ceo",
    });
    trackAnalyticsEvent("valid_drop", {
      level_id: "floor_001",
      piece_id: "sleeping-intern",
      move_number: 2,
    });
    trackAnalyticsEvent(
      "invalid_drop",
      {
        level_id: "floor_001",
        piece_id: "person@example.com",
        move_number: -3,
        reason: "overlap",
        email: "person@example.com",
      } as never,
    );
    trackAnalyticsEvent("level_completed", {
      level_id: "floor_001",
      move_count: 4,
      elapsed_ms: 1200,
      score: 28,
    });
    trackAnalyticsEvent("lawsuit_triggered", {
      level_id: "floor_001",
      rule_id: "unsafe-equipment-stacking",
      strike_count: 4,
    });
    trackAnalyticsEvent("replay_viewed", {
      level_id: "floor_001",
      source: "highlight",
    });
    trackAnalyticsEvent("install_cta_selected", {
      surface: "completion",
      result: "prompted",
    });

    const events = getBufferedAnalyticsEvents();
    expect(events.map(({ event }) => event)).toEqual(ANALYTICS_EVENT_NAMES);
    expect(events).toHaveLength(9);
    expect(analyticsGlobal.dataLayer).toHaveLength(9);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(events[1]?.properties.level_id).toBe("floor_001");
    expect(events[4]?.properties).toEqual({
      level_id: "floor_001",
      move_number: 0,
      reason: "overlap",
    });
    expect(JSON.stringify(events)).not.toContain("person@example.com");
  });
});

describe("Checkpoint 6 public naming and proof contracts", () => {
  it("keeps prohibited historical naming out of every public-facing source and asset name", () => {
    const roots = ["app", "components", "game", "public"].map((folder) =>
      resolve(webRoot, folder),
    );
    const textExtensions = new Set([
      ".css",
      ".html",
      ".js",
      ".json",
      ".md",
      ".svg",
      ".ts",
      ".tsx",
      ".txt",
      ".webmanifest",
    ]);
    const prohibitedMarks = ["tet" + "ris", "tetri" + "mino"];
    const findings: string[] = [];

    for (const root of roots) {
      for (const path of allFiles(root)) {
        const publicPath = relative(webRoot, path).replaceAll("\\", "/");
        const searchable = [
          publicPath,
          ...(textExtensions.has(extname(path).toLowerCase())
            ? [readFileSync(path, "utf8")]
            : []),
        ]
          .join("\n")
          .toLowerCase();
        for (const mark of prohibitedMarks) {
          if (searchable.includes(mark)) findings.push(`${publicPath}: ${mark}`);
        }
      }
    }

    expect(findings).toEqual([]);
  });

  it("requires the named screenshot package and verifies honest viewport dimensions", () => {
    const exactViewports: Record<string, { width: number; height: number }> = {
      "homepage-desktop-1440x900.png": { width: 1440, height: 900 },
      "homepage-mobile-390x844.png": { width: 390, height: 844 },
      "homepage-tablet-768x1024.png": { width: 768, height: 1024 },
      "playable-desktop-1440x900.png": { width: 1440, height: 900 },
      "playable-mobile-390x844.png": { width: 390, height: 844 },
    };
    for (const [name, dimensions] of Object.entries(exactViewports)) {
      expect(imageDimensions(resolve(screenshotRoot, name)), name).toEqual(dimensions);
    }

    const fullPages = [
      ["full-page-desktop.png", 1440, 900],
      ["full-page-mobile.png", 390, 844],
    ] as const;
    for (const [name, width, minimumHeight] of fullPages) {
      const dimensions = imageDimensions(resolve(screenshotRoot, name));
      expect(dimensions.width, name).toBe(width);
      expect(dimensions.height, name).toBeGreaterThanOrEqual(minimumHeight);
    }

    for (const name of [
      "valid-placement.png",
      "invalid-placement.png",
      "squish.png",
      "lawsuit.png",
      "completion.png",
    ]) {
      const dimensions = imageDimensions(resolve(screenshotRoot, name));
      expect(dimensions.width, name).toBeGreaterThanOrEqual(1200);
      expect(dimensions.height, name).toBeGreaterThanOrEqual(720);
    }
  });
});
