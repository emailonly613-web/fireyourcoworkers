# 24-Hour Preview — Checkpoint 6 Public Preview Build Summary

Date: 2026-07-29

## Scope delivered

- Living cinematic glass-elevator hero at `/`.
- Public brand is only **Fire Your Coworkers**.
- Original layered vector CEO, sleeping intern, and broken copy machine.
- Animated elevator lighting, papers, character reactions, HR meter, and machine motion.
- Immediate **Play Now** interaction changes HR from 18% acceptable to a 72% formal warning.
- Sound is off by default.
- Desktop and mobile layouts fill the first viewport without horizontal overflow.
- Deterministic 6×6 Mandatory Elevator Meeting level integrated directly below the hero.
- Original Sleeping Intern, Micro-Managing CEO, and Broken Copy Machine art reused as playable pieces.
- Mouse/pointer drag, tap/click selection, keyboard-compatible cell placement, rotation, undo, and restart.
- Green accepted-placement feedback and persistent red rejected-placement feedback.
- Collision, boundary, blocked-control, atomic-placement, undo, restart, replay, and solved-state contracts.
- Completion state: **Elevator Full — Technically Legal**.
- Deterministic 0–100 HR evaluation with arrangement rules and persistent action history.
- Four visible rule states: Improper Employee Orientation, Unsafe Equipment Stacking,
  Unscheduled Executive Contact, and Repeated Invalid Employee Drop.
- Cosmetic wall/contact pressure, upside-down orientation, rattle, and character reactions.
- Recoverable 100% lawsuit sequence that freezes new placements while preserving Undo and Restart.
- Compliance-aware completion ratings: Perfectly Compliant, Technically Legal, or HR Will Follow Up.
- Premium character, replay, challenge, install, launch-list, and footer presentation prepared below the game.
- Complete premium root-page journey: living hero, integrated playable floor, character world,
  replay storyboard, exact-challenge pitch, PWA/install section, honest launch-list state, and footer.
- Honest install control that exposes the native prompt only when the browser supplies it and
  otherwise provides accurate Add to Home Screen guidance.
- Dedicated 1200×630 Open Graph preview from the real hero plus matching social metadata.
- Responsive desktop, tablet, and mobile compositions with reduced-motion coverage.
- Installable PWA foundation with a live manifest, dedicated install assets, controlled
  service worker, versioned cache, update path, and verified offline starter level.
- Anonymous analytics adapter with all nine approved event names observed from live
  public-preview interactions.
- Eight truthful social concepts exported in MP4 and WebM, plus real desktop and mobile
  browser gameplay recordings.
- Isolated public preview deployed from commit `8d62473f2773cc70981bfe866e81f3d6938d21d3`.

## Proof files

- `screenshots/homepage-desktop-1440x900.png` — 1440×900.
- `screenshots/homepage-mobile-390x844.png` — 390×844.
- `screenshots/hero-chaos-desktop-1440x900.png` — interaction state showing the HR warning.
- `screenshots/playable-desktop-1440x900.png` — integrated desktop game at 1440×900.
- `screenshots/playable-mobile-390x844.png` — integrated mobile game at 390×844.
- `screenshots/valid-placement.png` — accepted green placement feedback.
- `screenshots/invalid-placement.png` — rejected red placement feedback.
- `screenshots/completion.png` — completed deterministic level.
- `screenshots/squish.png` — upside-down, wall-compressed CEO with live HR exposure.
- `screenshots/lawsuit.png` — 100% HR lawsuit document with all active violations.
- `screenshots/homepage-tablet-768x1024.png` — full cinematic tablet hero at 768×1024.
- `screenshots/full-page-desktop.png` — complete desktop root-page proof.
- `screenshots/full-page-mobile.png` — complete mobile root-page proof.
- `screenshots/public-preview-desktop.png` — live public preview at desktop width.
- `screenshots/public-preview-mobile.png` — live public preview at mobile width.
- `PUBLIC-URL.txt` — canonical isolated public-preview URL and boundary.
- `build/deployment-reference.txt` — app, deployment, source, and production-boundary identifiers.
- `reports/deployment-verification.txt` — public HTTP and control-plane proof.
- `reports/pwa-runtime-verification.txt` — manifest, worker, cache, and offline runtime proof.
- `reports/analytics-events-verification.txt` — live event observation and delivery boundary.
- `reports/console-errors-verification.txt` — strict clean-console result after favicon correction.
- `reports/checkpoint-6-final-verification.txt` — separate final PASS/FAIL grades for every launch gate.
- `videos/desktop-gameplay.webm` and `videos/mobile-gameplay.webm` — real browser interaction recordings.
- `videos/social-clips/GENERATION-REPORT.md` — 8/8 media-contract and hash inventory.
- `videos/social-clips/PUBLISH-COPY.md` — approved hooks, captions, CTAs, and preview URLs.

## Verification

- TypeScript: PASS.
- Automated tests: PASS, 42 tests across hero, deterministic core, HR, PWA, analytics, and checkpoint-6 contracts.
- Optimized production build: PASS.
- Prior local desktop browser console: PASS, no warnings or errors in the checkpoint-5 capture.
- Prior local mobile browser console: PASS, no warnings or errors in the checkpoint-5 capture.
- Desktop viewport: PASS, 1440×900 with no overflow.
- Mobile viewport: PASS, 390×844 with no overflow.
- Hero interaction: PASS, exactly one Play Now control and HR warning transition confirmed.
- Real mouse drag: PASS.
- Valid and invalid placement feedback: PASS.
- Atomic invalid placement: PASS; rejected drops do not mutate occupancy.
- Rotate, undo, restart, and solved state: PASS.
- Lawsuit fixture: PASS at exactly 100% with all four rule categories visible.
- Lawsuit input lock: PASS; new placement and rotation disabled while Undo and Restart remain available.
- Lawsuit recovery: PASS; Undo removes the triggering arrangement and returns the live score to 80% without erasing persistent incident history.
- Cosmetic pressure/orientation proof: PASS; the CEO remains visibly upside down during pressure animation.
- Mobile game surface and controls: PASS with no horizontal overflow.
- Complete root-page structure: PASS; one H1 and six distinct H2 section promises are present.
- Desktop full-page presentation: PASS at 1440 px wide with no horizontal overflow.
- Tablet presentation: PASS at 768×1024 with no horizontal overflow.
- Mobile full-page presentation: PASS at 390 px wide with no horizontal overflow.
- Character, replay, challenge, install, launch-list, and footer sections: PASS in rendered browser proof.
- Install fallback guidance: PASS; no unsupported native prompt or fake signup behavior.
- Open Graph preview: PASS at 1200×630 using real build artwork.
- Prohibited public marks and fake engagement counts: PASS, absent from the application surface.
- Public preview deployment: PASS at
  `https://fireyourcoworkers-codex-preview-hxnxm.ondigitalocean.app/`; app and deployment are ACTIVE.
- Deployment identity: PASS; `8d62473f2773cc70981bfe866e81f3d6938d21d3` is the
  last commit that changed `public-preview/`. Later branch commits add proof files only.
- PWA runtime: PASS; Chromium is controlled by `/sw.js` with cache
  `fire-your-coworkers-shell-v1`.
- Offline starter level: PASS; offline reload returned HTTP 200 from the service worker and
  retained the title, H1, Mandatory Elevator Meeting text, game board, and piece tray.
- Analytics runtime: PASS; all nine approved anonymous event names were observed in live
  interaction and published to the local dataLayer adapter.
- Live public-preview mobile console: PASS, zero warnings, console errors, page errors, or
  request failures at 390×844.
- Live public-preview desktop console: PASS after explicit SVG/PNG favicon metadata was
  deployed; zero console errors were observed while the real 99→100 lawsuit path ran.
- Social creative package: PASS; 8/8 concepts are present in both MP4 and WebM and satisfy
  the 1080×1920, 30 fps, six-second, yuv420p, silent export contract.

## Checkpoint boundary

The isolated Checkpoint 6 public preview, PWA runtime, offline starter level, anonymous
event adapter, clean-console gate, gameplay recordings, and eight-creative package are verified.

**PRODUCTION CUTOVER: NOT DONE.** The production app and custom domain remain separate from
this verified preview; no replacement production deployment is claimed.
