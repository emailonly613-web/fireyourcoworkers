# Fire Your Coworkers — Status

Last updated: 2026-07-29 (visual overhaul + 30 floors + economy + PWA + viral surface)
Domain: **fireyourcoworkers.com** (owned; not yet pointed anywhere)
Root: `D:\corporate-tetris` · Site: `web/` (index.html + manifest.webmanifest + sw.js + icon.svg)

---

## Proven this session — all numbers from runs executed today

```
> node web/levelgen.mjs      30 floors generated, every solution independently re-validated
> node web/verify.mjs        23 passed, 0 failed
> node web/e2e.mjs           74 passed, 0 failed   (real Chrome, real pointer events)
> node web/e2e.mjs --all     199 passed, 0 failed  (ALL 30 floors beaten by real drags)
```

Proof screenshots in `web/proof/` — per-floor start/win, dead-end loss, mobile viewport,
and `win-share-rating.png` showing the full viral money screen (HR rating + share button).

## The product, as of now

**Playable web game, PWA-installable, one deploy away from live.**

- **12 characters**, each visually distinct (accessories, faces, gradients) and animated
  (idle bob, blinks, squash-stretch landings, squish-under-pressure faces; machines get
  LEDs instead of feelings). Elevator doors close on a win; confetti; screen shake; score
  pops; floor-name bubbles; `prefers-reduced-motion` honored.
- **30 named floors**, difficulty 46%→92% density, all with embedded machine-validated
  solutions. Floors 21–30 are the premium tier.
- **Economy (desire-first, truthfully staged):** coins earned per floor; Company Store
  sells the **Full Office Pass** (floors 21–30, 1200🪙) and two skin packs (Midnight
  Shift 600🪙, Golden Parachute 1800🪙) that recolor the whole cast live. Everything
  visible from minute one; store copy says real-money instant unlocks arrive at launch.
- **Viral surface per the operator's business model:**
  - `?floor=N` deep links — a clip can land the viewer on the exact challenge
  - Locked-floor deep links open the store instead of dead-ending
  - Win screen: funny **HR Compliance rating** (Exemplary → Lawsuit Pending, driven by
    undos+invalid drops) + **Challenge a coworker** share button (Web Share API,
    clipboard fallback) with a pre-written brag line and floor link
  - **PWA:** manifest + offline-first service worker + icon; installable on Android
    Chrome and iOS Safari Add-to-Home-Screen once served over HTTPS
- Wallet, best score persist in localStorage. No account. Play is instant.

## Operator's business model (received in full, on file)

Four metrics gate everything: play rate (target 40%+), first-level completion (70%+),
share rate (5%+), paid conversion (2%+). Catalog at launch: Full Office Pass $9.99,
My Office Pack $14.99 (custom photo coworkers — needs server+Stripe, TOP post-launch
feature), Department Pack $24.99, cosmetics $4.99. Build for $100k/mo; don't spend like
it exists. Not ad-only. No sponsor assumptions pre-traffic.

Client-side Stripe seam is ready: catalog items + `owns()` entitlements map 1:1 to
future Stripe Price IDs; Checkout replaces the coin button per item when the owner's
account is wired.

## Deploy — waiting ONLY on the operator

`deploy/README-DEPLOY.md` + `deploy/do-app.yaml`: DO App Platform static site, zero
build, nameservers listed, post-deploy checklist. The e2e harness runs against
production via `FYC_URL=https://fireyourcoworkers.com node web/e2e.mjs --all` — that run
is the definition of "live", per R0.

## Bugs caught by the harness this session (all fixed, all would have hit players)

- Test-side: instant-drag-after-navigation raced the tray pop-in animation (fixed with
  settle waits + per-piece asserts); zero-coin shop assertion was wrong after a 30-floor
  run banked thousands of coins (replaced with affordable⇔enabled invariant).
- The affordability invariant now proves the desire loop end-to-end: broke at 0 coins,
  correct at 2950.

## Still honestly missing for public launch (v2 DoD)

Deploy (operator), analytics/crash reporting (milestone 3 — first thing after traffic
exists), replay export + challenge results (milestone 4 — share links exist, replays
don't), real-money purchases (operator's Stripe), store/privacy/rights (8–9).
Unity: still not installed, still never compiled; web is the launch vehicle.

## Next

1. **Operator:** push to GitHub, create the DO app (or send site instructions), flip
   nameservers. I cannot do this step — it needs your accounts.
2. **Me, the moment it resolves:** full harness against production, then report "live"
   with the run output — not before.
3. Then milestone 3: analytics on the four gating metrics.
