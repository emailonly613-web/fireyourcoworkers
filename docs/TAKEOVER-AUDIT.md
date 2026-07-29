# Codex Takeover Audit

Date: 2026-07-29  
Repository: `D:\corporate-tetris`  
Baseline commit: `3357987c17d9c1826ab94e70dc796dd078c9e090`  
Baseline tag: `codex-takeover-baseline-2026-07-29`

## Verified baseline

- `node web/verify.mjs`: 23 passed, 0 failed.
- `node web/e2e.mjs`: 74 passed, 0 failed in Chrome.
- The live root at `https://fireyourcoworkers.com` serves the legacy game-only build.
- The legacy root is functional but fails the new website, hero, character-art, and
  visual-quality contracts.

## Existing architecture

- Production: one handwritten `web/index.html` with inline CSS and JavaScript.
- Basic PWA: `web/manifest.webmanifest`, `web/sw.js`, and one SVG icon.
- Browser harness: Node scripts using Puppeteer Core.
- Legacy Unity source: Unity 6000.0.23f1 C# scripts without a scene, prefabs, complete
  project metadata, or a locally installed Unity editor.

## Reusable work

- Rotation normalization and atomic placement rules.
- Embedded solver fixtures and level ideas.
- Undo, restart, input-stress, resize, and deep-link test scenarios.
- HR-rule concepts and separation of deterministic logic from cosmetic squish.
- Network-first navigation lesson from the second service worker revision.

## Rejected work

- Game-only root page.
- Colored rectangular characters and CSS faces.
- Monolithic inline implementation.
- Client-authoritative wallet and premium ownership.
- Completion rating standing in for a real HR rule/lawsuit engine.
- Screenshot capture without screenshot comparison.

## Security and product gaps

- No CSP, HSTS, or `X-Content-Type-Options` response headers on the legacy host.
- No signed challenges, backend entitlement authority, analytics adapter, replay,
  interaction recording, performance proof, or rights ledger.
- Package lock was ignored and the sole dependency used a range.
- Client content reaches `innerHTML`; remote content would require sanitization.

## Platform decision

The production public preview will use Next.js, React, TypeScript, and a browser-only
Phaser runtime backed by a pure TypeScript game core. Unity remains archived reference.
The current Unity material cannot satisfy the public PWA gates as delivered.
