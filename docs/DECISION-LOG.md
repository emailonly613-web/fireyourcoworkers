# Decision Log

## D-001 — Freeze the Claude baseline

- Date: 2026-07-29
- Decision: Preserve commit `3357987` under annotated tag
  `codex-takeover-baseline-2026-07-29` before replacement work.
- Reason: The old site is rejected but contains working mechanics and useful tests.
- Consequence: No destructive deletion is required; any old state remains recoverable.

## D-002 — Web-native production path

- Date: 2026-07-29
- Decision: Use Next.js + React for the site/PWA shell, Phaser behind a client boundary
  for the runtime, and a pure TypeScript package for deterministic game rules.
- Reason: The delivered Unity material has no runnable scene or WebGL proof, while the
  launch contract requires fast mobile browser play, deep links, PWA updates, and a
  website surrounding the game.
- Consequence: Existing Unity and vanilla-JavaScript logic are parity references, not
  production sources of truth.

## D-003 — Public naming

- Date: 2026-07-29
- Decision: Public surfaces use only **Fire Your Coworkers**.
- Reason: The takeover dispatch prohibits public use of the obsolete internal codename
  and related protected terminology without written legal clearance.
- Consequence: Historical names may remain only in archived files and the existing
  internal repository path until a later controlled repository migration.

## D-004 — 24-hour checkpoint discipline

- Date: 2026-07-29
- Decision: Stop after the living-hero desktop/mobile proof for founder review before
  proceeding to playable-game integration.
- Reason: The authoritative 24-hour override requires six visible checkpoints.
