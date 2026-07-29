# 24-Hour Preview — Checkpoint 5 Build Summary

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

## Verification

- TypeScript: PASS.
- Automated tests: PASS, 34 tests across hero, deterministic core, HR, PWA, and analytics contracts.
- Optimized production build: PASS.
- Desktop browser console: PASS, no warnings or errors.
- Mobile browser console: PASS, no warnings or errors.
- Desktop viewport: PASS, 1440×900 with no overflow.
- Mobile viewport: PASS, 390×844 with no overflow.
- Hero interaction: PASS, exactly one Play Now control and HR warning transition confirmed.
- Real mouse drag: PASS.
- Valid and invalid placement feedback: PASS.
- Atomic invalid placement: PASS; rejected drops do not mutate occupancy.
- Rotate, undo, restart, and solved state: PASS.
- Lawsuit fixture: PASS at exactly 100% with all four rule categories visible.
- Lawsuit input lock: PASS; new placement and rotation disabled while Undo and Restart remain available.
- Lawsuit recovery: PASS; Undo removes the triggering arrangement and returns the live score to 82% without erasing persistent incident history.
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

## Checkpoint boundary

Checkpoint 5 is complete. Checkpoint 6 PWA, analytics, deployment, recordings, and social
creative proof is active. Offline runtime proof, social creatives, and replacement deployment
are not claimed complete.
