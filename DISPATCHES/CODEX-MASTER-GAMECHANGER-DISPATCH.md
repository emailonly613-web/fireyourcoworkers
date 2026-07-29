# FIRE YOUR COWORKERS
## CODEX MASTER GAMECHANGER TAKEOVER DISPATCH
### Version 1.0 — Web/PWA-First Product, Game, Website, Virality, Revenue, and Proof

**Authority:** This file supersedes every prior Claude prompt, preview-site instruction, and incomplete architectural assumption for this project.

**Product target:** A premium, web-first, installable PWA game launched from the target domain `fireyourcoworkers.com`, with immediate browser play, direct challenge links, direct web payments, and a future path to native wrappers or stores only after the web product proves itself.

**Public working brand:** **Fire Your Coworkers**

**Internal mechanic description:** Corporate office packing puzzle.

**Critical naming restriction:** Do not use **Corporate Tetris**, **Tetris**, **Tetrimino**, Tetris logos, Tetris trade dress, or Tetris-branded language in public-facing product code, metadata, assets, marketing, domains, or screenshots unless written legal clearance or a license is supplied. “Corporate Tetris” may remain only as an internal historical codename in archived notes. Replace public references with terms such as:
- office packing puzzle
- elevator packing game
- workplace block puzzle
- grid-packing comedy game
- Fire Your Coworkers

---

# 0. TAKEOVER CONTEXT

Claude was removed from the project because the delivered website preview missed the product vision.

The rejected preview was:
- a dark generic SaaS-style landing page;
- an empty 4×4 developer grid;
- emoji pieces instead of expressive characters;
- dashboard cards instead of a living game world;
- a mechanics proof rather than a premium entertainment product;
- visually unrelated to the approved concept art;
- not remotely acceptable as the front door to a potentially large consumer-game business.

Do not patch the rejected preview into production. Preserve it only in an archive/reference folder so the failure is documented.

The approved product direction is:
1. The visitor lands inside the game world.
2. The first viewport is visually cinematic and immediately understandable.
3. A living glass elevator, expressive coworkers, flying paper, warnings, sound, and motion sell the joke before explanatory text.
4. The visitor can begin playing almost immediately.
5. The website, PWA shell, gameplay, challenge loop, monetization, and growth systems form one product.
6. The product is web/PWA-first. App-store submission is not a launch dependency.
7. No milestone is accepted from code, compilation, or text claims alone. It must be visually and behaviorally proven in a real browser.

---

# 1. FOUNDER VISION — DO NOT DRIFT

## Core concept

The player tightly packs increasingly bizarre and dysfunctional office characters and equipment into a glass elevator grid.

The game combines:
- satisfying deterministic grid packing;
- highly relatable office satire;
- expressive character reactions;
- cosmetic squish and glass compression;
- absurd HR relationship rules;
- intentionally shareable failures and cliffhangers;
- exact challenge links that let recipients attempt the same puzzle immediately.

## The actual viral promise

This is not merely “blocks with office skins.”

The winning product is:

> A deterministic packing puzzle where every technically correct arrangement can still become an absurd workplace liability.

## The primary gameplay loop

```text
Choose piece
→ drag
→ rotate
→ inspect valid/invalid preview
→ drop
→ character reacts
→ HR rules recalculate
→ complete, fail, undo, or trigger lawsuit
→ receive humorous rating
→ share replay or exact challenge
→ recipient plays immediately
```

## Launch distribution loop

```text
Short-form clip or shared challenge
→ fireyourcoworkers.com opens directly
→ no account wall
→ exact level begins
→ player completes or fails
→ replay/result generated
→ player shares
→ optional PWA install prompt after demonstrated value
→ optional direct purchase
```

---

# 2. NON-NEGOTIABLE PRODUCT DECISIONS

## 2.1 Web/PWA first

The production launch must be a web-native installable PWA.

The PWA must:
- load from a normal URL;
- work in current Chromium, Safari, Firefox, and Edge within documented support limits;
- support mouse, touch, and keyboard accessibility where practical;
- be installable through browser-supported mechanisms;
- include a valid web app manifest;
- include an offline-capable service worker;
- cache a small playable core;
- recover safely from stale service-worker versions;
- have explicit update and rollback handling;
- preserve challenge URLs and route state;
- open in standalone display mode after installation where supported.

Do not describe web-app installation as ordinary native sideloading in product copy. Use “Install the game” or “Add to Home Screen.”

## 2.2 Web-native game architecture

Use a web-native 2D game engine and deterministic TypeScript core.

Default architecture:
- TypeScript
- current stable React/Next.js App Router for the site, PWA shell, SEO pages, account/payment surfaces, and server routes;
- current stable Phaser for the actual game scene, input, animation, audio, particles, and canvas/WebGL rendering;
- pure TypeScript game-core package for grid logic, rotations, HR rules, replay events, level validation, and deterministic tests;
- a package manager workspace/monorepo;
- PostgreSQL-compatible persistent data layer for entitlements, challenges, content versions, experiments, and optional accounts;
- Stripe for direct web purchases;
- vendor adapters for analytics, error monitoring, email, storage, and content delivery.

Codex must verify the current stable versions and record them in `docs/TECH-BASELINE.md` before implementation.

## 2.3 Existing Unity work

Do not blindly discard working Unity code. First inspect it.

Unity may be retained for:
- logic reference;
- future native version;
- animation/art experiments;
- content tooling;
- future store builds.

Unity WebGL may be used for the PWA launch only if it passes all of these gates:
- acceptable mobile Safari behavior;
- initial download and decompression budgets;
- first playable time;
- memory use;
- service-worker update reliability;
- responsive scaling;
- replay/video export requirements;
- real-device frame-rate requirements;
- integration with the surrounding site;
- challenge deep-link startup;
- accessibility and browser-back behavior.

If it fails any launch-critical gate, do not force Unity into the web product. Port or share the deterministic rules through the TypeScript production implementation.

No deletion of existing work until:
- it is inventoried;
- useful logic/assets are copied or documented;
- the old state is tagged or archived;
- the decision is recorded in `docs/DECISION-LOG.md`.

---

# 3. REQUIRED REPOSITORY SHAPE

Codex may adapt names to the existing repository, but the separation of responsibilities must remain.

```text
/
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── public/
│       ├── styles/
│       ├── server/
│       └── tests/
├── packages/
│   ├── game-core/
│   │   ├── grid/
│   │   ├── items/
│   │   ├── placement/
│   │   ├── hr/
│   │   ├── levels/
│   │   ├── replay/
│   │   └── tests/
│   ├── game-runtime/
│   │   ├── scenes/
│   │   ├── input/
│   │   ├── animation/
│   │   ├── audio/
│   │   ├── effects/
│   │   └── ui/
│   ├── content-schema/
│   ├── analytics/
│   ├── payments/
│   └── shared/
├── content/
│   ├── characters/
│   ├── levels/
│   ├── hr-rules/
│   ├── voice-lines/
│   ├── replay-templates/
│   └── live-events/
├── assets/
│   ├── source/
│   ├── optimized/
│   ├── audio/
│   ├── fonts/
│   └── licenses/
├── docs/
│   ├── CODEX-STATUS.md
│   ├── DECISION-LOG.md
│   ├── TECH-BASELINE.md
│   ├── PRODUCT-CONTRACT.md
│   ├── VISUAL-CONTRACT.md
│   ├── ANALYTICS-DICTIONARY.md
│   ├── CONTENT-RELEASE-LEDGER.md
│   ├── THIRD-PARTY-SDK-LEDGER.md
│   ├── RIGHTS-LEDGER.md
│   └── RELEASE-CHECKLIST.md
├── tests/
│   ├── e2e/
│   ├── visual/
│   ├── performance/
│   └── fixtures/
└── proof/
    ├── screenshots/
    ├── videos/
    ├── reports/
    └── builds/
```

---

# 4. VISUAL CONTRACT — THE SITE MUST BE REDONE FROM SCRATCH

## 4.1 Rejected style

The production site must not resemble:
- a SaaS dashboard;
- a project-management product;
- a developer test harness;
- a dark page made of generic cards;
- an emoji prototype;
- a template landing page with the game pushed below the fold;
- a static marketing page that merely describes gameplay.

## 4.2 Approved visual direction

The approved reference is `references/APPROVED-GAME-LOOK.png`.

Treat it as direction, not pixel-perfect final art.

Required mood:
- cinematic office comedy;
- polished 2D/2.5D cartoon rendering;
- dark navy office depth with warm fluorescent or elevator lighting;
- reflective glass elevator walls;
- metal frames, control panels, hazard lighting, and office detail;
- bold yellow/orange game accent;
- red HR warning states;
- green valid-placement states;
- expressive readable faces;
- characters whose silhouettes communicate their grid shapes;
- high contrast and legibility on mobile;
- physical comedy visible without reading text.

## 4.3 First viewport

The first viewport must function as a living game poster.

It must contain:
- the Fire Your Coworkers wordmark;
- a large glass elevator occupying the visual center;
- at least the Sleeping Intern, Micro-Managing CEO, and Broken Copy Machine;
- visible movement before interaction;
- the intern sleeping or sliding;
- the CEO watching the cursor or muttering;
- paper twitching or emerging from the printer;
- an HR meter integrated into the game world;
- one obvious draggable object;
- a clear “Play” action;
- muted-by-default audio with an obvious sound control;
- no email form in the primary visual hierarchy;
- no large explanatory card replacing the game.

Within the first few seconds, a visitor must understand:
- this is a game;
- objects fit into an elevator;
- coworkers react;
- HR can object;
- the tone is comedy.

## 4.4 Website experience structure

### Scene A — Living Hero

- Full-width cinematic office/elevator environment.
- Immediate character motion.
- Cursor/touch parallax used carefully.
- One guided drag interaction.
- A placement glow inside the elevator.
- Wrong placement can trigger a short scripted reaction.
- Hero animation must not block page load or interaction.
- Reduced-motion mode must be supported.

### Scene B — Full Playable Preview

- One fully playable polished level.
- Same art language as the hero.
- No visual downgrade into emoji blocks.
- Drag, rotate, drop, undo, restart.
- Valid and invalid previews.
- Cosmetic squish.
- HR score and violations.
- Completion and lawsuit states.
- Mouse and touch.
- Mobile-first layout.

### Scene C — Character Universe

Character cards should feel like animated employee files, not generic feature cards.

Initial launch characters:
- Sleeping Intern
- Micro-Managing CEO
- Broken Copy Machine
- Emotional Support Raccoon
- HR Director
- Employee Who Always Circles Back
- IT Guy Who Has Seen Everything
- Employee Eating Fish at Their Desk
- Motivational-Speaker Manager
- Eight-Coffee Employee
- Compliance Lawyer
- Office Chair With One Bad Wheel

Each character needs:
- recognizable silhouette;
- shape matrix;
- facial states;
- voice/reaction family;
- HR tags;
- relationship rules;
- visual effects;
- shareable signature moment.

### Scene D — Viral Replay Demonstration

Show an actual vertical replay generated by the product:
- one-tile gap;
- printer explosion;
- compressed CEO;
- lawsuit at 100;
- technically legal finish.

Do not use fake engagement counts.

### Scene E — Challenge Loop

Explain by showing:
- a sender result;
- “Beat my HR score”;
- exact challenge link;
- receiver entering the same level;
- receiver creating a new result.

### Scene F — Product and purchase

Only after the visitor has seen and played the fun:
- Full Office Pass
- My Office Mode waitlist/coming-soon state if not enabled
- cosmetic packs
- clear direct web pricing
- no deceptive countdown
- no fake crossed-out price
- no forced account before value.

### Scene G — Install PWA

Display platform-aware instructions:
- browser install prompt where available;
- iPhone Safari Add to Home Screen instructions when needed;
- install only after the user has played or intentionally requested it;
- never trap the user behind install instructions.

## 4.5 Art requirements

Do not use emoji as production characters.

Allowed for a first engineering placeholder only:
- original layered SVG characters created in the repository;
- original vector facial components;
- skeletal or sprite animation using owned assets;
- original temporary voice effects with clear placeholder labels.

Not acceptable for an accepted visual milestone:
- emoji;
- colored rectangles;
- stock icons standing in for characters;
- copyrighted company logos;
- unlicensed music;
- copied character art;
- “final art later” while claiming the site is approved.

The milestone can use an original high-quality vector character kit while final production illustration and professional voice recording continue. The status must identify every non-final asset.

## 4.6 Responsive requirements

Prove the actual site at:
- 1440×900 desktop;
- 1280×720 laptop;
- 1024×768 tablet landscape;
- 768×1024 tablet portrait;
- 430×932 large phone;
- 390×844 mainstream phone;
- 360×800 compact Android.

No horizontal clipping.
No hidden controls.
No unreadably small grid.
No game requiring hover.
No drag interaction broken by page scrolling.
No address-bar resize corruption.
No accidental zoom on input.
No content under unsafe mobile areas.

---

# 5. GAME CORE CONTRACT

## 5.1 Deterministic grid

Implement a pure deterministic grid engine with:
- configurable width and height;
- integer coordinate system;
- shape normalization;
- clockwise rotation;
- atomic validation and occupancy;
- overlap rejection;
- boundary rejection;
- item ownership per cell;
- undo;
- restart;
- serialization;
- replay determinism;
- level completion;
- solver-compatible state.

Cosmetic physics must never decide whether an item fits.

## 5.2 Office item

Each item must contain:
- stable content ID;
- display name;
- shape coordinates;
- allowed rotations;
- pivot/anchor metadata;
- category and tags;
- visual profile;
- squish profile;
- audio profile;
- HR properties;
- relationship hooks;
- replay importance;
- accessibility label;
- content version.

## 5.3 Input

Support:
- pointer drag;
- touch drag;
- tap/click selection;
- rotate button;
- keyboard rotate and placement fallback;
- optional gesture rotation only if it does not damage usability;
- UI touch exclusion;
- pointer cancellation;
- browser resize;
- tab visibility change;
- interrupted drag recovery;
- prevention of multi-piece control.

## 5.4 Placement presentation

While dragging:
- show complete occupied-cell preview;
- green valid state;
- red invalid state;
- directional snap;
- active-piece elevation and shadow;
- glass/contact reaction;
- immediate update after rotation;
- no real occupancy until release.

On invalid drop:
- return to tray or previous stable placement;
- play impact/squish;
- character reaction;
- optional HR action penalty;
- no corrupted occupancy.

## 5.5 Squish system

Maintain strict separation:

### Logical representation
- shape;
- position;
- rotation;
- occupancy;
- HR evaluation;
- replay.

### Visual representation
- squash;
- stretch;
- face compression;
- glass contact;
- bone/sprite deformation;
- settle animation;
- secondary motion.

Squish must:
- be clamped;
- never change occupied cells;
- respond to wall and neighbor pressure;
- reset after undo;
- distinguish people from rigid equipment;
- support reduced motion.

## 5.6 HR violation system

Support:
- orientation rules;
- adjacency rules;
- relative-position rules;
- action rules;
- character relationship rules;
- equipment safety;
- management abuse;
- animal policy;
- designated grid-zone rules.

Separate:
- action violations that persist for the attempt;
- arrangement violations that exist only while the arrangement exists.

Persistent rule keys must prevent duplicate scoring.

Initial required rules:
- employee upside down;
- intern touching management;
- heavy equipment above employee;
- printer blocking controls;
- executive underneath junior staff;
- animal next to electrical equipment;
- repeated invalid employee drop.

HR states:
- 0–24 Acceptable
- 25–49 Concerning
- 50–74 Formal Warning
- 75–99 Legal Is Typing
- 100 Lawsuit

At 100:
- pause new input;
- lawsuit document impact;
- show top violations;
- allow restart;
- allow undo when it can restore a legal state;
- do not destroy game state.

Completion ratings:
- Perfectly Compliant
- Technically Legal
- HR Will Follow Up

## 5.7 Initial polished vertical-slice level

Build one level first that is visually complete enough to judge the product.

It must include:
- a glass elevator;
- integrated 4×4 or other deliberately selected grid;
- all required pieces exactly filling the board;
- Sleeping Intern;
- Broken Copy Machine;
- Micro-Managing CEO;
- Emotional Support Raccoon;
- HR Director;
- at least three active HR relationships;
- at least one valid perfect solution;
- at least one “technically legal” solution;
- one lawsuit path;
- one intentionally shareable failure;
- no impossible state unless the player creates it and can undo/restart.

Do not add dozens of shallow levels before this one feels excellent.

---

# 6. CONTENT DATA CONTRACT

Content must be data-driven and validated.

At minimum:
- JSON or equivalent typed content schema;
- runtime schema validation;
- unique IDs;
- content version;
- explicit shape coordinates;
- known prefab/asset references;
- voice-line metadata;
- HR rules;
- level references;
- replay template references;
- compatibility rules;
- clear errors;
- safe fallback.

Reject:
- empty shapes;
- duplicate cells;
- unknown references;
- unsupported rotations;
- invalid relative-position rules;
- unsolvable levels;
- missing rights metadata for production assets;
- content incompatible with the running app.

Create automated level validation:
- solve each level;
- prove at least one accepted completion;
- verify all required items fit;
- verify score bands are reachable where promised;
- verify content updates do not silently invalidate live challenges.

---

# 7. AUDIO AND COMEDY CONTRACT

Do not hardcode lines in gameplay classes.

Events:
- OnGrab
- OnDragHeld
- OnRotate
- OnInvalidRotation
- OnValidDrop
- OnInvalidDrop
- OnSquished
- OnHRViolation
- OnThreshold
- OnLevelComplete
- OnLawsuit

Audio controls:
- per-event cooldown;
- no immediate repetition;
- voice priority;
- maximum simultaneous clips;
- mute;
- music volume;
- voice volume;
- effects volume;
- browser autoplay compliance;
- user gesture before audio activation;
- accessibility captions for meaningful lines.

Initial signature lines can include:
- “Let’s circle back.”
- “This could have been an email.”
- “Five more minutes.”
- “Who approved this placement?”
- “Legal is typing.”
- “That was my lower back.”

Use only original or properly licensed voice recordings.

---

# 8. VIRAL SYSTEM — MUST BE BUILT INTO THE PRODUCT

## 8.1 Deterministic replay

Record actions, not merely pixels:
- content version;
- level;
- item;
- pointer path samples;
- rotations;
- drop targets;
- results;
- HR events;
- voice-line IDs;
- animation event IDs;
- timing;
- completion/failure.

Replay playback:
- reproduces the same logical result;
- cannot grant progression;
- cannot trigger purchases or rewards;
- validates content compatibility;
- reports mismatches.

## 8.2 Highlight selector

Automatically select the strongest moment:
1. one-tile impossible gap;
2. lawsuit transition;
3. face against glass;
4. printer paper explosion;
5. signature voice line;
6. last-second fit;
7. rapid HR chain;
8. absurd but legal completion.

Weights must be remotely configurable.

## 8.3 Share output

Create:
- 9:16 vertical replay;
- high-resolution target when supported;
- performance fallback;
- still-image fallback;
- title watermark;
- challenge code/link;
- captions;
- safe zones;
- no fake metrics;
- no copyrighted music.

Use browser-supported recording/export where reliable and create a server-render fallback if device-side export is inconsistent.

## 8.4 Challenge links

A challenge URL must open:
- exact level;
- compatible content version;
- starting arrangement;
- score target;
- optional special rule.

Security:
- signed payload;
- expiration/version rules where appropriate;
- no trusted entitlements in the URL;
- no client-authoritative rewards;
- reject tampering;
- rate limiting;
- privacy-safe IDs.

## 8.5 Creator mode

Build an internal creator route protected from normal users.

It must:
- load any level;
- set any character;
- force reaction;
- force HR score;
- trigger lawsuit;
- hide UI;
- set camera;
- set playback speed;
- render vertical clips;
- queue templates;
- output metadata;
- batch-render social variants.

Initial templates:
- Printer Leaves One Tile
- Intern Rotated Wrong
- CEO Pinned Against Glass
- Lawsuit at 99 to 100
- Last-Second Perfect Fit
- Raccoon Electrical Violation
- Obvious Mistake Not Fixed
- Technically Legal Arrangement

Before launch, produce at least 30 usable vertical clips across multiple hooks.

---

# 9. WEBSITE GROWTH LOOP

## 9.1 Immediate play

No account required for:
- homepage preview;
- first levels;
- opening a challenge;
- receiving an HR result;
- basic replay viewing.

## 9.2 Install prompt

Ask for PWA installation only:
- after level completion;
- after an explicit install button;
- after repeated meaningful engagement;
- not immediately on arrival.

Track:
- install availability;
- prompt shown;
- accepted;
- dismissed;
- standalone launch;
- platform-specific instruction viewed.

## 9.3 First-session design

Target:
1. first meaningful action quickly;
2. obvious first placement;
3. first character reaction;
4. first invalid-drop joke;
5. first completion;
6. HR reveal;
7. challenge/share prompt;
8. optional install;
9. optional purchase only after value.

No long onboarding.
No forced email.
No tracking prompt before gameplay.
No sound blast before user gesture.

---

# 10. DIRECT WEB MONETIZATION

The site is not dependent on app-store billing at web launch.

## 10.1 Initial offer structure

Free:
- immediate play;
- introductory chapter;
- daily sample;
- challenge links;
- replay sharing.

Full Office Pass:
- target price test around $9.99;
- main chapters;
- no forced ads if ads are later introduced;
- extra characters;
- daily/weekly challenges;
- permanent entitlement.

My Office Mode:
- not public on day-one unless safety and processing are complete;
- target test around $14.99;
- private cartoonized coworker slots;
- custom department challenge;
- personalized replay;
- local/private-first.

Department Pack:
- target test around $24.99;
- more private custom characters;
- shared private office level;
- multiple arrangements;
- downloadable result pack.

Cosmetics:
- elevator themes;
- costumes;
- office backgrounds;
- owned voice packs;
- seasonal visual packs.

Prices are experiments, not hardcoded truth.

## 10.2 Payment implementation

Use Stripe through server-side routes:
- Checkout or appropriate web payment surface;
- server-side secret;
- webhook verification;
- idempotency;
- entitlement ledger;
- refunds;
- disputes;
- revocation;
- duplicate-event handling;
- test mode;
- tax strategy documented;
- privacy disclosures;
- receipt support;
- clear purchase terms.

Never trust a client redirect as payment proof.

## 10.3 Ads

Do not make web display ads the main business.

Rewarded or interstitial web advertising may be investigated only after:
- player value is proven;
- user experience is protected;
- network policy and browser support are validated;
- remote kill switches exist;
- retention impact is measurable.

Direct purchases and paid personalization are the priority.

---

# 11. MY OFFICE MODE — BUILD THE DOOR, KEEP IT OFF AT FIRST

Real coworker photos can be a powerful post-launch amplifier, but they are not required for the fictional-character launch.

Feature-flag it off by default.

Safe product contract:
- private by default;
- adult users only;
- permission confirmation;
- nickname guidance;
- no public directory;
- no public face search;
- no company ranking;
- no public voting;
- no biometric identification;
- no face embeddings for identity matching;
- no model training on uploads;
- local/on-device crop and stylization where feasible;
- original photo discarded after processing where feasible;
- delete person;
- review-before-share;
- hide-name toggle;
- report/removal process for publicly accessible challenge links.

Build schemas and boundaries now so the later feature does not require a dangerous rewrite.

Do not activate until:
- privacy policy is accurate;
- processing architecture is proven;
- deletion works;
- moderation/removal process exists;
- legal review is complete;
- the fictional game has proven retention and sharing.

---

# 12. ANALYTICS, EXPERIMENTATION, AND REMOTE CONTROL

Use adapters. Gameplay code must not call vendor SDKs directly.

Initial capabilities:
- product analytics;
- error monitoring;
- performance telemetry;
- feature flags;
- experiments;
- server logs;
- privacy-respecting anonymous IDs.

Required funnel events:

Lifecycle:
- app_open
- session_start
- session_end
- standalone_pwa_launch

Onboarding:
- tutorial_started
- tutorial_step_completed
- tutorial_completed
- tutorial_abandoned

Gameplay:
- level_loaded
- level_started
- item_selected
- item_grabbed
- item_rotated
- drop_valid
- drop_invalid
- undo_used
- hr_violation
- hr_threshold
- lawsuit
- level_completed
- level_failed
- rating_received
- next_level_started

Virality:
- replay_generated
- replay_failed
- share_sheet_opened
- share_completed_when_detectable
- challenge_created
- challenge_opened
- challenge_started
- challenge_completed

PWA:
- install_available
- install_prompt_shown
- install_accepted
- install_dismissed
- ios_install_instructions_viewed

Revenue:
- offer_viewed
- checkout_started
- checkout_completed
- checkout_failed
- entitlement_granted
- refund_received
- entitlement_revoked

Content/ops:
- manifest_loaded
- manifest_rejected
- content_downloaded
- rollback_used
- remote_config_loaded
- kill_switch_used
- experiment_exposure

Never send:
- uploaded faces;
- full names;
- free-form sensitive text;
- payment data;
- raw challenge secrets;
- unnecessary personal information.

Remote switches:
- all purchases;
- each offer;
- replay export;
- challenge links;
- PWA install prompts;
- downloadable content;
- each character;
- each level;
- each HR rule;
- My Office Mode;
- experiments;
- maintenance mode.

---

# 13. LIVE CONTENT AND CONTENT FACTORY

The business cannot require a code deployment for every level or joke.

Create:
- signed/versioned content manifest;
- compatibility rules;
- checksums;
- staged activation;
- previous-known-good rollback;
- local fallback content;
- content release ledger;
- remote disable per asset/character/rule/level;
- immutable historical content references for active challenges.

Minimum public-launch content target:
- 30 fully validated handcrafted levels;
- 10 additional remotely deliverable levels;
- 12 characters/objects;
- 100 approved reaction lines;
- 20 HR rules;
- 10 replay templates;
- 30 social clips;
- 3 office/elevator environments;
- daily challenge;
- weekly featured event.

Do not create 30 weak levels before the vertical slice is accepted.

Suggested chapters:
- Lobby Orientation
- Open Office Disaster
- Executive Floor
- IT Department
- Mandatory Retreat
- Legal Is Typing

---

# 14. PWA AND PERFORMANCE CONTRACT

## Required PWA files/capabilities

- web manifest;
- multiple icon sizes;
- maskable icon;
- standalone display;
- theme/background colors;
- start URL and scope;
- service worker;
- offline page;
- cached playable starter level;
- update notification;
- safe cache versioning;
- stale-build recovery;
- no infinite reload loops;
- secure HTTPS production configuration.

## Performance budgets

Codex must measure and document, not assume.

Initial target budgets:
- marketing shell visible quickly on a simulated mid-tier mobile connection;
- first meaningful hero interaction within 2.5 seconds where reasonably achievable;
- first playable level within 4 seconds on a representative mobile test;
- lazy-load noncritical game chapters and videos;
- maintain 60 FPS on supported mid/high devices and a stable acceptable fallback on lower-tier devices;
- no large cumulative layout shift;
- no input delay that makes drag feel sticky;
- marketing route JavaScript separated from heavy game code;
- compressed modern image formats;
- compressed, streamed, and capped audio;
- explicit memory cleanup between scenes;
- no unbounded particle systems;
- no replay export that freezes the UI without progress feedback.

Record actual:
- JavaScript sizes;
- asset sizes;
- first contentful paint;
- largest contentful paint;
- interaction latency;
- frame rate;
- memory use where tooling permits;
- replay export duration;
- offline startup.

---

# 15. SECURITY AND PRIVACY BASELINE

- HTTPS only in production.
- Content Security Policy.
- secure headers.
- no client secrets.
- server validation for all writes.
- signed challenge payloads.
- webhook signature verification.
- rate limits.
- bot/abuse controls on challenge creation and signup.
- strict upload types and sizes if uploads are later enabled.
- dependency audit.
- lockfile.
- secret scanning.
- environment separation.
- sanitized logs.
- data retention policy.
- deletion path.
- backups for paid entitlements and content metadata.
- no unnecessary accounts.
- anonymous play supported.

Maintain:
- `docs/THIRD-PARTY-SDK-LEDGER.md`
- `docs/RIGHTS-LEDGER.md`
- `docs/PRIVACY-DATA-MAP.md`
- `docs/SECURITY-THREAT-MODEL.md`

---

# 16. BRAND AND LEGAL GATES

## 16.1 Tetris naming

“Corporate Tetris” is not approved public branding.

Use “Fire Your Coworkers” publicly.

Before launch:
- attorney/trademark review of product name and logos;
- trademark search;
- domain/social handle review;
- avoid Tetris trade dress, terminology, music, and branded visual cues;
- ensure puzzle shapes and presentation are original rather than copying protected branded presentation.

## 16.2 Rights

Every production asset needs:
- source;
- creator;
- license or assignment;
- usage territory;
- term if applicable;
- modification rights;
- commercial rights;
- attribution requirement;
- proof file.

Applies to:
- artwork;
- animation;
- voices;
- sound effects;
- music;
- fonts;
- icons;
- video;
- creator content.

No recognizable real company, executive, employee, logo, product, or celebrity without documented rights.

---

# 17. TESTING AND VISUAL PROOF

## 17.1 Automated test layers

Unit:
- rotations;
- normalization;
- occupancy;
- undo;
- HR rules;
- score;
- challenge signatures;
- content schemas;
- level solver;
- replay determinism;
- entitlement logic.

Integration:
- game scene and core;
- content load;
- payment webhook;
- manifest activation;
- PWA update;
- challenge open;
- replay generation.

End-to-end:
- first visit;
- play;
- rotate;
- invalid drop;
- valid placement;
- undo;
- complete;
- share;
- open challenge;
- install pathway;
- purchase test mode;
- offline reload.

## 17.2 Browser matrix

At minimum:
- current Chrome desktop;
- current Edge desktop;
- current Firefox desktop;
- current Safari macOS if available;
- Android Chrome real device;
- iPhone Safari real device;
- installed PWA on Android;
- Home Screen web app on iPhone.

## 17.3 Playwright visual regression

Create stable visual snapshots for:
- first viewport;
- hero interaction;
- full game;
- valid preview;
- invalid preview;
- squish;
- HR warning;
- lawsuit;
- completion;
- replay;
- purchase section;
- install instructions;
- all required responsive sizes.

Visual tests must compare actual screenshots, not DOM existence alone.

## 17.4 Proof package after every milestone

Provide:
- exact commit/branch;
- files changed;
- commands run;
- passed/failed tests;
- browser screenshots;
- real-device evidence when required;
- screen recording for interactions;
- performance report;
- placeholders;
- known issues;
- decision;
- exact next task.

No “looks good.”
No “should work.”
No acceptance from a local compile alone.

---

# 18. CODEX OPERATING RULES

1. Inspect before modifying.
2. Do not ask the founder to operate development tools.
3. Do not create a mock when a working experience was requested.
4. Do not replace visual proof with logs.
5. Do not call placeholders final.
6. Do not add unrelated infrastructure.
7. Do not drift into app-store work before the PWA launch path is proven.
8. Do not build public photo uploads at launch.
9. Do not use public Tetris branding.
10. Do not delete old work without archiving and documenting.
11. Do not silently change product decisions.
12. Do not begin a new milestone while the previous gate is rejected.
13. Fix observed failures rather than explaining them away.
14. Use the browser with eyes: screenshots, recordings, visual comparisons.
15. Keep the founder-facing report in plain English.
16. Keep detailed technical evidence in the repository.
17. If a dependency or approach is obsolete, verify current official documentation and record the replacement.
18. If a requirement is impossible in a browser, prove the limitation and implement the strongest safe fallback.
19. Build for maintainability, content scale, and rollback.
20. Report evidence, not optimism.

---

# 19. MILESTONE ORDER

## Milestone 0 — Takeover audit and freeze

Deliver:
- repository inventory;
- running instructions;
- current screenshots;
- current game status;
- current site status;
- current tests;
- current architecture;
- reusable work;
- rejected work;
- security issues;
- dependency status;
- explicit Unity-versus-web decision;
- `CODEX-STATUS.md`;
- `DECISION-LOG.md`;
- baseline tag or archive.

Do not spend days auditing. Complete the audit, capture proof, and move directly into the accepted vertical slice.

## Milestone 1 — Premium integrated website + playable vertical slice

This is the immediate priority.

Deliver a production-grade homepage/PWA shell and one polished level:
- living cinematic hero;
- original illustrated/vector characters;
- playable hero interaction;
- full playable level;
- drag/rotate/drop/undo/restart;
- squish;
- HR rules;
- lawsuit;
- completion;
- responsive;
- PWA manifest/service worker;
- offline starter;
- visual tests;
- browser screenshots;
- mobile proof.

This milestone replaces the rejected site.

## Milestone 2 — Replay, sharing, and challenge loop

- deterministic replay;
- highlight selector;
- vertical export;
- still fallback;
- signed exact challenge links;
- recipient loop;
- analytics;
- creator mode.

## Milestone 3 — Content system and launch chapter

- validated content schema;
- solver;
- first 10 excellent levels;
- character universe;
- audio system;
- daily challenge foundation;
- remote content.

## Milestone 4 — Direct payments and entitlements

- Full Office Pass;
- Stripe test flow;
- webhooks;
- entitlements;
- refunds/revocation;
- purchase proof;
- pricing experiments.

## Milestone 5 — Growth, PWA installation, analytics, and experiments

- install funnel;
- feature flags;
- experiments;
- lifecycle analytics;
- performance/error monitoring;
- creator assets;
- SEO/social metadata.

## Milestone 6 — Launch content and operations

- 30 validated levels;
- 12 characters;
- 100 reactions;
- 30 clips;
- live events;
- content rollback;
- support/privacy/terms;
- production deployment;
- soft launch.

## Milestone 7 — My Office private beta

Only after fictional product metrics support it:
- local/private custom coworkers;
- safe photo processing;
- deletion;
- consent;
- private challenges;
- moderation/removal;
- paid pack experiment.

---

# 20. MILESTONE 1 ACCEPTANCE CHECKLIST

Milestone 1 is rejected unless every applicable item is proven.

## Experience
- [ ] Hero visibly feels like the game.
- [ ] The elevator is the central visual object.
- [ ] Characters are not emojis.
- [ ] A visitor can begin interacting immediately.
- [ ] The joke is understandable without reading long copy.
- [ ] Visual quality clearly exceeds the rejected preview.
- [ ] Same character art appears in hero and playable level.
- [ ] Site is not a dashboard/card template.

## Game
- [ ] Drag works with mouse.
- [ ] Drag works with touch.
- [ ] Rotation works.
- [ ] Preview updates after rotation.
- [ ] Valid placement is atomic.
- [ ] Invalid placement restores safely.
- [ ] Undo clears correct cells.
- [ ] Restart resets all state.
- [ ] Squish never changes logical cells.
- [ ] HR rules deduplicate.
- [ ] Lawsuit state is recoverable.
- [ ] Completion rating is correct.
- [ ] Level is solver-validated.

## Website/PWA
- [ ] Correct public brand: Fire Your Coworkers.
- [ ] No public Corporate Tetris/Tetris references.
- [ ] Manifest valid.
- [ ] Service worker works.
- [ ] Offline starter works.
- [ ] Update flow works.
- [ ] Deep routes reload.
- [ ] Mobile safe areas work.
- [ ] SEO metadata exists.
- [ ] Open Graph image exists.
- [ ] Reduced motion exists.
- [ ] Sound controls exist.

## Proof
- [ ] 1440×900 screenshot.
- [ ] 390×844 screenshot.
- [ ] 768×1024 screenshot.
- [ ] valid-preview screenshot.
- [ ] invalid-preview screenshot.
- [ ] squish screenshot.
- [ ] lawsuit screenshot.
- [ ] completion screenshot.
- [ ] interaction recording.
- [ ] tests pass.
- [ ] visual regression pass.
- [ ] performance report.
- [ ] remaining placeholders listed.

---

# 21. LAUNCH BUSINESS GATES

No one can guarantee virality or millions. Build the system and use evidence.

Initial internal gates, subject to refinement:
- high first-action rate;
- strong first-level completion;
- measurable multi-level continuation;
- challenge creation;
- recipient challenge starts;
- repeat sessions;
- PWA install after value;
- paid conversion;
- low crash/error rate;
- stable mobile performance;
- social clips that generate qualified traffic.

Do not scale paid acquisition because a clip gets views.

Scale only when:
- viewers become players;
- players finish;
- players share;
- recipients play;
- some players pay;
- content can be produced repeatedly;
- the system remains stable.

---

# 22. REQUIRED FIRST CODEX RESPONSE

Before editing, Codex must return a concise takeover report containing:

1. Repository root.
2. Existing technology stack.
3. Current runnable commands.
4. What is actually working.
5. What is visually rejected.
6. What can be reused.
7. Whether current Unity work can meet the PWA gates.
8. Exact Milestone 1 implementation plan.
9. Files it will create or replace.
10. Proof it will produce.

Then Codex should begin Milestone 1 immediately unless a true external blocker exists.

Do not ask the founder to choose libraries or perform technical setup that Codex can resolve by inspection.

---

# 23. EXACT START COMMAND FOR CODEX

Read this entire file and all files in `references/`.

You are taking over as the implementation CTO for Fire Your Coworkers.

This dispatch supersedes all prior Claude instructions and rejected preview work.

The public launch is web/PWA-first from the target domain fireyourcoworkers.com. The website and game are one premium product. The current generic emoji/dashboard preview is rejected and must be rebuilt from scratch.

Start with Milestone 0, but keep it brief and evidence-based. Then immediately execute Milestone 1: the premium integrated website and polished playable vertical slice.

Do not report success from compilation. Use Playwright and real browser/device proof. Compare the result against `references/APPROVED-GAME-LOOK.png` and prove that it no longer resembles the rejected screenshots.

Preserve useful existing work, archive rejected work, and record all decisions.

Publicly brand the product only as Fire Your Coworkers. Treat Corporate Tetris as an internal obsolete codename because public Tetris naming is not approved.

Maintain:
- docs/CODEX-STATUS.md
- docs/DECISION-LOG.md
- docs/TECH-BASELINE.md
- docs/VISUAL-CONTRACT.md

Stop only after Milestone 1 has code, tests, screenshots, an interaction recording, PWA proof, performance evidence, and a precise remaining-placeholder list.
