export const ANALYTICS_EVENT_NAMES = [
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
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

type PageSurface = "home" | "game" | "challenge" | "replay" | "creator" | "unknown";
type PlaySource = "hero" | "menu" | "challenge" | "replay" | "offline" | "unknown";
type DropFailure = "out_of_bounds" | "overlap" | "hr_rule" | "unknown";
type ReplaySource = "challenge" | "highlight" | "creator" | "unknown";
type InstallSurface = "hero" | "menu" | "completion" | "unknown";
type InstallResult = "prompted" | "instructions" | "unavailable";
type ShareSurface = "hero" | "game" | "completion" | "lawsuit";
type ShareMethod = "web_share" | "clipboard" | "manual";
type ShareOutcome = "shared" | "copied" | "canceled" | "manual";
type ChallengeResult = "completed" | "lawsuit";
type ChallengeOutcome = "beat" | "tied" | "missed" | "lawsuit";

export interface AnalyticsEventPayloadMap {
  page_view: { surface: PageSurface };
  play_started: { level_id: string; source: PlaySource };
  first_piece_grabbed: { level_id: string; piece_id: string };
  valid_drop: { level_id: string; piece_id: string; move_number: number };
  invalid_drop: {
    level_id: string;
    piece_id: string;
    move_number: number;
    reason: DropFailure;
  };
  level_completed: {
    level_id: string;
    move_count: number;
    elapsed_ms: number;
    score?: number;
    shift_id?: string;
  };
  lawsuit_triggered: { level_id: string; rule_id: string; shift_id?: string; strike_count: number };
  replay_viewed: { level_id: string; source: ReplaySource };
  install_cta_selected: { surface: InstallSurface; result: InstallResult };
  share_selected: {
    level_id: string;
    surface: ShareSurface;
    method: ShareMethod;
    outcome: ShareOutcome;
    shift_id?: string;
  };
  challenge_opened: { level_id: string; target_result: ChallengeResult };
  challenge_completed: {
    level_id: string;
    move_count: number;
    score: number;
    outcome: ChallengeOutcome;
  };
}

type AnalyticsPrimitive = string | number | boolean;

export interface AnonymousAnalyticsEvent<E extends AnalyticsEventName = AnalyticsEventName> {
  readonly event: E;
  readonly properties: Readonly<Record<string, AnalyticsPrimitive>>;
  readonly occurred_at: string;
  readonly schema_version: 1;
}

export type AnalyticsSink = (event: AnonymousAnalyticsEvent) => void;

type FieldRule =
  | { type: "identifier" }
  | { type: "number"; max: number }
  | { type: "enum"; values: readonly string[] };

const PAGE_SURFACES: readonly PageSurface[] = [
  "home",
  "game",
  "challenge",
  "replay",
  "creator",
  "unknown",
];
const PLAY_SOURCES: readonly PlaySource[] = [
  "hero",
  "menu",
  "challenge",
  "replay",
  "offline",
  "unknown",
];
const DROP_FAILURES: readonly DropFailure[] = [
  "out_of_bounds",
  "overlap",
  "hr_rule",
  "unknown",
];
const REPLAY_SOURCES: readonly ReplaySource[] = [
  "challenge",
  "highlight",
  "creator",
  "unknown",
];
const INSTALL_SURFACES: readonly InstallSurface[] = [
  "hero",
  "menu",
  "completion",
  "unknown",
];
const INSTALL_RESULTS: readonly InstallResult[] = [
  "prompted",
  "instructions",
  "unavailable",
];
const SHARE_SURFACES: readonly ShareSurface[] = ["hero", "game", "completion", "lawsuit"];
const SHARE_METHODS: readonly ShareMethod[] = ["web_share", "clipboard", "manual"];
const SHARE_OUTCOMES: readonly ShareOutcome[] = ["shared", "copied", "canceled", "manual"];
const CHALLENGE_RESULTS: readonly ChallengeResult[] = ["completed", "lawsuit"];
const CHALLENGE_OUTCOMES: readonly ChallengeOutcome[] = ["beat", "tied", "missed", "lawsuit"];

const IDENTIFIER: FieldRule = { type: "identifier" };
const MOVE_NUMBER: FieldRule = { type: "number", max: 100_000 };
const EVENT_FIELDS: Record<AnalyticsEventName, Record<string, FieldRule>> = {
  page_view: { surface: { type: "enum", values: PAGE_SURFACES } },
  play_started: {
    level_id: IDENTIFIER,
    source: { type: "enum", values: PLAY_SOURCES },
  },
  first_piece_grabbed: { level_id: IDENTIFIER, piece_id: IDENTIFIER },
  valid_drop: {
    level_id: IDENTIFIER,
    piece_id: IDENTIFIER,
    move_number: MOVE_NUMBER,
  },
  invalid_drop: {
    level_id: IDENTIFIER,
    piece_id: IDENTIFIER,
    move_number: MOVE_NUMBER,
    reason: { type: "enum", values: DROP_FAILURES },
  },
  level_completed: {
    level_id: IDENTIFIER,
    move_count: MOVE_NUMBER,
    elapsed_ms: { type: "number", max: 86_400_000 },
    score: { type: "number", max: 1_000_000_000 },
    shift_id: IDENTIFIER,
  },
  lawsuit_triggered: {
    level_id: IDENTIFIER,
    rule_id: IDENTIFIER,
    shift_id: IDENTIFIER,
    strike_count: MOVE_NUMBER,
  },
  replay_viewed: {
    level_id: IDENTIFIER,
    source: { type: "enum", values: REPLAY_SOURCES },
  },
  install_cta_selected: {
    surface: { type: "enum", values: INSTALL_SURFACES },
    result: { type: "enum", values: INSTALL_RESULTS },
  },
  share_selected: {
    level_id: IDENTIFIER,
    surface: { type: "enum", values: SHARE_SURFACES },
    method: { type: "enum", values: SHARE_METHODS },
    outcome: { type: "enum", values: SHARE_OUTCOMES },
    shift_id: IDENTIFIER,
  },
  challenge_opened: {
    level_id: IDENTIFIER,
    target_result: { type: "enum", values: CHALLENGE_RESULTS },
  },
  challenge_completed: {
    level_id: IDENTIFIER,
    move_count: MOVE_NUMBER,
    score: { type: "number", max: 100 },
    outcome: { type: "enum", values: CHALLENGE_OUTCOMES },
  },
};

const MAX_BUFFERED_EVENTS = 200;
const bufferedEvents: AnonymousAnalyticsEvent[] = [];
const additionalSinks = new Set<AnalyticsSink>();

type DataLayerGlobal = typeof globalThis & {
  dataLayer?: Array<Record<string, unknown>>;
};

function sanitizeField(value: unknown, rule: FieldRule): AnalyticsPrimitive | undefined {
  if (rule.type === "identifier") {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim().toLowerCase();
    return /^[a-z0-9][a-z0-9_.:-]{0,63}$/.test(normalized)
      ? normalized
      : undefined;
  }

  if (rule.type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
    return Math.min(rule.max, Math.max(0, Math.round(value)));
  }

  return typeof value === "string" && rule.values.includes(value)
    ? value
    : undefined;
}

function sanitizePayload(
  event: AnalyticsEventName,
  payload: Record<string, unknown>,
): Readonly<Record<string, AnalyticsPrimitive>> {
  const sanitized: Record<string, AnalyticsPrimitive> = {};

  for (const [key, rule] of Object.entries(EVENT_FIELDS[event])) {
    const value = sanitizeField(payload[key], rule);
    if (value !== undefined) sanitized[key] = value;
  }

  return Object.freeze(sanitized);
}

function isKnownEvent(event: string): event is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(event);
}

function publish(event: AnonymousAnalyticsEvent): void {
  bufferedEvents.push(event);
  if (bufferedEvents.length > MAX_BUFFERED_EVENTS) bufferedEvents.shift();

  if (typeof document !== "undefined") {
    document.documentElement.dataset.analyticsCount = String(bufferedEvents.length);
    document.documentElement.dataset.analyticsEvents = bufferedEvents
      .map((entry) => entry.event)
      .join(",");
  }

  const dataLayer = (globalThis as DataLayerGlobal).dataLayer;
  if (Array.isArray(dataLayer)) {
    try {
      dataLayer.push({
        event: event.event,
        ...event.properties,
        fyc_schema_version: event.schema_version,
      });
    } catch {
      // Measurement must never interrupt the game loop.
    }
  }

  for (const sink of additionalSinks) {
    try {
      sink(event);
    } catch {
      // Optional development or future delivery sinks fail independently.
    }
  }
}

export function trackAnalyticsEvent<E extends AnalyticsEventName>(
  event: E,
  payload: AnalyticsEventPayloadMap[E],
): AnonymousAnalyticsEvent<E> | null {
  if (!isKnownEvent(event)) return null;

  const record = Object.freeze({
    event,
    properties: sanitizePayload(event, payload as Record<string, unknown>),
    occurred_at: new Date().toISOString(),
    schema_version: 1 as const,
  });

  publish(record);
  return record;
}

export function addAnalyticsSink(sink: AnalyticsSink): () => void {
  additionalSinks.add(sink);
  return () => additionalSinks.delete(sink);
}

export function getBufferedAnalyticsEvents(): readonly AnonymousAnalyticsEvent[] {
  return bufferedEvents.slice();
}

export function clearBufferedAnalyticsEvents(): void {
  bufferedEvents.length = 0;
}
