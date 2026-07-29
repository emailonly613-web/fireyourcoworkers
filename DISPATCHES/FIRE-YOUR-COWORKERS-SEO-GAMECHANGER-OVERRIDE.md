# FIRE YOUR COWORKERS — SEO GAMECHANGER OVERRIDE

## Authority

This file supplements and overrides any shallow SEO instruction in the existing Fire Your Coworkers Codex master dispatch and 24-hour execution override.

The existing requirement to “add SEO metadata” is not sufficient.

SEO must be implemented as a product and content architecture that turns the game’s characters, levels, replays, challenges, jokes, and releases into durable search-acquisition assets.

This is a web/PWA-first launch. Search engines must be able to understand the product without executing or visually interpreting the game canvas.

Do not delay the premium website or playable first level. Build the launch SEO foundation alongside the public website, then expand the searchable content system after the initial deployment.

---

# 1. SEO BUSINESS OBJECTIVE

Build a compounding acquisition channel that can rank and earn traffic for:

- Fire Your Coworkers branded searches;
- funny browser puzzle game searches;
- office and workplace comedy game searches;
- packing and fitting puzzle searches;
- individual character searches;
- individual level and challenge searches;
- gameplay replay and short-video searches;
- office-humor and team-challenge searches;
- future seasonal events and character launches.

SEO is not a replacement for the 24-hour social launch. Social video creates the initial spike. Search architecture captures branded demand, supports discovery, compounds over time, and makes every successful social asset permanently discoverable.

Do not promise rankings, traffic, or virality. Report implementation proof and measurable search data.

---

# 2. NON-NEGOTIABLE RENDERING ARCHITECTURE

The website may use Canvas, WebGL, Phaser, React, and client-side animation for gameplay, but all indexable pages must provide meaningful server-rendered or statically generated HTML.

## Required rule

A crawler that does not interact with the game must still receive:

- a unique page title;
- a unique meta description;
- one clear visible H1;
- explanatory body copy;
- crawlable internal links;
- canonical URL;
- indexation directive;
- relevant structured data;
- image or video metadata;
- descriptive fallback content.

Do not place the only useful page content inside:

- Canvas;
- WebGL;
- an image;
- a video;
- a client-only modal;
- a JavaScript-generated route with no server HTML.

The game must remain playable when JavaScript runs, while the surrounding page remains understandable and indexable before hydration.

---

# 3. INDEXABLE SITE ARCHITECTURE

Implement a clear, crawlable route system.

## Core commercial and product pages

```text
/
/play
/how-to-play
/characters
/levels
/replays
/updates
/about
/support
/privacy
/terms
```

## Character pages

```text
/characters/sleeping-intern
/characters/micro-managing-ceo
/characters/broken-copy-machine
/characters/emotional-support-raccoon
```

Each published character page must contain genuinely unique material:

- original character artwork;
- character biography;
- puzzle shape and gameplay role;
- signature reactions;
- voice-line examples owned by the project;
- HR relationships;
- one playable or animated demonstration;
- one unique image;
- one short video where available;
- related characters and levels;
- direct Play CTA.

## Level pages

```text
/levels/mandatory-elevator-meeting
/levels/printer-jam-friday
/levels/executive-floor-crisis
```

Each indexable level page must include:

- unique level name and premise;
- playable preview or exact challenge entry;
- characters included;
- important HR rules;
- difficulty and objective;
- unique screenshot or poster;
- unique copy written for that level;
- related levels;
- replay or solution teaser without spoiling everything.

Do not publish thousands of auto-generated level pages containing only IDs, scores, or repeated templates.

## HR-rule pages

```text
/hr-violations/improper-employee-orientation
/hr-violations/unsafe-equipment-stacking
/hr-violations/unscheduled-executive-contact
```

Each page must explain the fictional in-game rule, show a gameplay example, link to relevant characters and levels, and contain original comedic copy.

## Replay and video pages

```text
/replays/printer-leaves-one-tile
/replays/ceo-pinned-against-glass
/replays/hr-goes-from-99-to-lawsuit
```

Only curated replays with unique video, title, thumbnail, description, transcript/caption text, and playable CTA may be indexed.

Random user replay IDs must not automatically become indexable pages.

## Challenge routes

Private, tokenized, or user-generated challenge URLs must default to:

```text
noindex, follow
```

They must canonicalize to the most relevant public level or play page unless they have been deliberately curated into a unique public page.

Do not let millions of thin challenge URLs enter the index.

---

# 4. SEARCH-INTENT CONTENT CLUSTERS

Build helpful pages around real user intent, not keyword stuffing.

Initial page hypotheses include:

```text
/office-puzzle-game
/funny-browser-games
/packing-puzzle-game
/workplace-comedy-game
/coworker-challenge-game
/free-online-office-game
```

These routes may only ship when they contain a genuinely useful, distinct page—not a swapped headline over duplicated copy.

Each search-intent page should include:

- a clear answer to what the game is;
- immediate playable content;
- relevant characters or levels;
- screenshots or video;
- what makes the experience different;
- a strong internal-link path;
- no exaggerated or unverifiable claims.

Before finalizing keywords, create a documented keyword-research pass using current Search Console data after launch, Google Ads Keyword Planner if available, Bing Webmaster data, social-search autocomplete, and competitor SERP review.

Do not fabricate search-volume numbers.

---

# 5. METADATA SYSTEM

Create one typed metadata generator used by every route.

Every indexable URL requires:

- unique `<title>`;
- unique meta description;
- canonical URL;
- Open Graph title;
- Open Graph description;
- Open Graph URL;
- Open Graph image;
- Twitter/X card metadata;
- correct robots directive;
- page-specific structured data;
- page-specific social image where material.

## Initial title hypotheses

Home:

```text
Fire Your Coworkers — The Office Packing Puzzle Game
```

Play:

```text
Play Fire Your Coworkers Free Online
```

Characters index:

```text
Meet the Office Disasters | Fire Your Coworkers
```

Example character:

```text
The Sleeping Intern | Fire Your Coworkers
```

Example level:

```text
Mandatory Elevator Meeting — Play the Office Puzzle
```

These are starting hypotheses, not immutable final copy. Validate clarity, truncation, duplication, and click-through performance.

Do not repeat the same title or description across routes.

---

# 6. STRUCTURED DATA

Implement valid JSON-LD that accurately matches visible page content.

## Home page

Use:

- `WebSite` for the site name;
- `Organization` for the publisher/owner where appropriate;
- `SoftwareApplication` for the PWA/game when the required fields are truthful and visible.

## Character, level, and editorial pages

Use where applicable:

- `BreadcrumbList`;
- `Article` for genuine news/editorial updates;
- `VideoObject` for pages centered on an accessible video;
- `ImageObject` where useful;
- `Product` and `Offer` only when a real purchasable offer exists and the visible page matches the markup.

Do not add:

- fake ratings;
- fake reviews;
- fake prices;
- invisible FAQ content;
- structured data unrelated to the visible page;
- duplicate conflicting schema nodes.

Create automated schema snapshots and manually validate launch templates with Google’s Rich Results Test and Schema Markup Validator.

---

# 7. VIDEO SEO — CORE GAMECHANGER CHANNEL

The game’s social clips must become durable on-site search assets.

For every curated clip:

- create a dedicated watch/replay page;
- use an indexable HTML title and description;
- provide a crawlable thumbnail;
- provide upload date;
- provide duration;
- provide transcript or accurate caption text;
- identify the level and characters;
- include a direct Play This Challenge CTA;
- use valid `VideoObject` JSON-LD;
- include the video in a video sitemap;
- ensure the video is prominent and playable on the page;
- avoid requiring login before playback;
- use stable video and thumbnail URLs.

Create a video sitemap that is automatically updated when a curated replay is published or removed.

Random or private user videos must remain excluded unless editorially approved.

---

# 8. IMAGE SEO AND CHARACTER ASSET DISCOVERY

Original character art is a search asset.

For each public image:

- use descriptive file names;
- use meaningful alt text;
- include dimensions to prevent layout shift;
- use modern formats with fallbacks where needed;
- place the image near relevant text;
- provide crawlable image URLs;
- prevent important images from being available only as Canvas pixels;
- include important character and level art in an image sitemap;
- generate high-resolution but optimized social and search variants.

Do not put keyword lists into alt text. Describe the visible image naturally.

---

# 9. SITEMAPS, ROBOTS, CANONICALS, AND INDEX CONTROL

Generate and serve:

```text
/robots.txt
/sitemap.xml or /sitemap-index.xml
/sitemaps/pages.xml
/sitemaps/characters.xml
/sitemaps/levels.xml
/sitemaps/replays-video.xml
/sitemaps/images.xml
```

Only canonical, indexable URLs belong in sitemaps.

`robots.txt` must reference the sitemap and allow access to assets required for rendering.

Use `noindex` rather than `robots.txt` when a crawlable page must stay out of results.

Canonical rules must normalize:

- HTTP to HTTPS;
- www versus non-www;
- trailing slash strategy;
- duplicate query parameters;
- campaign parameters;
- PWA start URLs;
- duplicate game state URLs;
- replay and challenge duplicates.

UTM and campaign parameters must not create separate canonical pages.

Return correct HTTP status codes:

- 200 for valid pages;
- 301/308 for permanent redirects;
- 404 or 410 for removed content;
- no soft 404 pages;
- no redirect chains.

---

# 10. INTERNAL LINKING AND DISCOVERY

Use real crawlable `<a href>` links for important navigation.

Do not make all navigation dependent on JavaScript click handlers.

Required internal-link graph:

- home links to Play, Characters, Levels, Replays, How to Play;
- each character links to related levels, HR rules, and characters;
- each level links to its characters, HR rules, and replays;
- each replay links to its level and Play CTA;
- every indexable page is reachable from another indexable page;
- breadcrumbs appear on deep content pages;
- footer links expose trust and support pages.

Use descriptive anchor text. Do not fill pages with repetitive exact-match links.

---

# 11. CORE WEB VITALS AND PERFORMANCE SEO

The cinematic website and game must not destroy search performance.

Required launch targets at the 75th percentile where field data is available:

```text
LCP <= 2.5 seconds
INP <= 200 milliseconds
CLS <= 0.1
```

Engineering budgets:

- server-render the first meaningful hero content;
- do not block the first render on the game engine;
- lazy-load the full game runtime after visible content or user intent where appropriate;
- preload only genuinely critical assets;
- compress character art and video;
- reserve layout space for media;
- split game, marketing, replay, and account bundles;
- minimize third-party scripts;
- load analytics after consent and without blocking interaction;
- keep the hero usable on low-tier mobile devices;
- support reduced motion;
- test slow 4G and mid/low-tier mobile CPU conditions.

A visually impressive page that fails badly on mobile performance is rejected.

---

# 12. MOBILE-FIRST INDEXING

Desktop and mobile pages must expose equivalent primary content, metadata, structured data, images, and links.

Do not hide all descriptive content on mobile.

Ensure:

- responsive rather than separate incomplete mobile URLs;
- same canonical strategy;
- mobile-readable text;
- touch-friendly controls;
- no intrusive launch interstitial covering the entire page;
- no install prompt before the visitor understands the product;
- no gameplay canvas that prevents access to navigation and content.

---

# 13. SEARCH CONSOLE, BING, AND INDEXING OPERATIONS

Prepare deployment for immediate verification in:

- Google Search Console;
- Bing Webmaster Tools.

After the production domain is connected:

1. Verify the domain property.
2. Submit the canonical sitemap index.
3. Inspect the home page, Play page, top character pages, top level page, and first video page.
4. Request indexing for the most important new URLs where appropriate.
5. Connect Search Console and analytics reporting.
6. Configure Bing Webmaster Tools.
7. Implement IndexNow for added, updated, and deleted public content URLs.
8. Do not send private challenge or account URLs to IndexNow.

Create deployment hooks that notify IndexNow only after a public page successfully deploys and passes validation.

---

# 14. AI SEARCH DISCOVERABILITY

Do not pursue fake “GEO hacks,” doorway pages, mass AI-written content, or unsupported claims about special AI-search files.

Make the site easy to understand through:

- clear entity naming;
- original explanatory content;
- accurate structured data;
- crawlable text;
- strong internal linking;
- original images and videos;
- transparent publisher information;
- stable URLs;
- real-world mentions and links earned through creators and press.

Optional files such as `llms.txt` must not be treated as a substitute for indexing, crawlability, or useful content.

---

# 15. LINK-EARNING AND DIGITAL-PR SYSTEM

Create assets other sites and creators have a reason to reference.

Required assets:

- press page;
- downloadable press kit;
- original character art samples;
- embed-ready curated replay player;
- creator challenge links;
- launch announcement page;
- character launch pages;
- data-backed game milestones only when truthful;
- contact information for media and creators.

Every embed option should include a visible attribution link to the relevant canonical page.

Do not buy spam links or mass-submit to irrelevant directories.

---

# 16. PROGRAMMATIC SEO QUALITY GATE

Programmatic publishing is allowed only when every page delivers unique player value.

Before an automatically generated page is indexable, validate:

- unique title;
- unique H1;
- unique meaningful copy;
- valid referenced character/level/content IDs;
- unique visual or video asset;
- playable or useful interaction;
- meaningful internal links;
- canonical URL;
- non-empty server-rendered HTML;
- no near-duplicate conflict;
- content length and quality threshold defined by substance, not keyword count.

If the gate fails, keep the URL unpublished or `noindex`.

Do not create city pages, company-name pages, coworker-name pages, or mass keyword permutations without genuine content and user intent.

---

# 17. SEO ANALYTICS AND EXPERIMENTATION

Track at minimum:

- organic landing page;
- branded versus non-branded query where available;
- search impressions;
- clicks;
- CTR;
- average position as diagnostic context;
- indexed versus submitted pages;
- crawl and sitemap errors;
- video impressions and clicks;
- image-search traffic;
- organic visitor-to-play rate;
- organic first-level completion;
- organic share rate;
- organic PWA-install CTA rate;
- organic purchase conversion when payments launch.

Do not optimize only for rankings. Optimize for qualified players and downstream completion, sharing, installation, and revenue.

Create a weekly SEO report that separates:

- brand demand;
- non-brand discovery;
- character pages;
- level pages;
- replay/video pages;
- editorial pages;
- technical errors;
- winning and losing page templates.

---

# 18. FIRST 24-HOUR SEO SLICE

SEO must not delay the playable public preview, but the first deployment must include a real foundation.

Ship before accepting the public preview:

1. Server-rendered home page.
2. Server-rendered `/play` page or integrated home-game section with crawlable descriptive content.
3. Three indexable character pages.
4. One indexable level page.
5. Three indexable HR-rule pages.
6. One curated replay/video page if a usable clip exists.
7. Unique titles, descriptions, H1s, canonicals, OG images, and robots directives.
8. `WebSite` and `Organization` structured data.
9. `SoftwareApplication` structured data when truthful and complete.
10. `BreadcrumbList` on deep pages.
11. `VideoObject` on the replay page.
12. Valid robots.txt.
13. Sitemap index plus pages, image, and video sitemap where applicable.
14. Correct 404 page and status.
15. Search Console verification method prepared.
16. Bing verification method prepared.
17. IndexNow implementation prepared or active.
18. Lighthouse and rendered-HTML proof.
19. Playwright tests for metadata, canonicals, status codes, and crawlable links.
20. A report listing which routes are indexable, noindex, or blocked and why.

---

# 19. AUTOMATED SEO TESTS

Add CI tests that fail the build for:

- missing or duplicate page titles;
- missing meta descriptions on indexable pages;
- missing canonical tags;
- canonical URLs returning non-200 responses;
- indexable pages absent from sitemaps;
- noindex pages included in sitemaps;
- broken internal links;
- missing H1;
- multiple conflicting primary H1s;
- invalid robots directives;
- missing image alt text for meaningful images;
- missing Open Graph image;
- invalid JSON-LD syntax;
- schema content that does not match visible page content;
- accidental indexing of private challenge/account routes;
- soft 404 behavior;
- redirect chains;
- server HTML lacking meaningful text;
- important links implemented only as JavaScript buttons;
- production pages referencing localhost or staging canonicals.

Use Playwright to inspect final rendered output and direct HTTP responses.

---

# 20. SEO PROOF PACKAGE

Do not report SEO complete based on metadata existing in source code.

Provide:

1. Route inventory with index/noindex status.
2. Title and description inventory.
3. Canonical inventory.
4. Sitemap URLs and validation output.
5. robots.txt contents.
6. JSON-LD output by template.
7. Rich Results Test or validator evidence.
8. Desktop and mobile rendered HTML evidence.
9. JavaScript-disabled or pre-hydration content evidence.
10. Lighthouse SEO and performance reports.
11. Core Web Vitals lab measurements.
12. Broken-link test results.
13. 404 and redirect proof.
14. Search Console verification status once credentials/domain are available.
15. Bing/IndexNow status once credentials/domain are available.
16. List of deferred SEO content and exact next publishing queue.

---

# 21. SEO REJECTION CONDITIONS

Reject the build if any of these are true:

- SEO consists only of a home-page title and Open Graph tags.
- The meaningful product description exists only inside Canvas or client JavaScript.
- Every page uses the same title or description.
- Private challenge links are indexable.
- Thin auto-generated pages are published for every score or user.
- Sitemaps contain redirects, noindex URLs, or noncanonical URLs.
- Robots.txt blocks assets required to render the page.
- Structured data contains fake ratings, reviews, prices, or hidden content.
- Character art cannot be discovered outside Canvas.
- Curated videos lack watch pages, thumbnails, or transcripts.
- Mobile content is materially weaker than desktop.
- The game engine blocks the first render and destroys mobile performance.
- Codex reports “SEO done” without deployment and rendered proof.

---

# 22. EXACT CODEX EXECUTION INSTRUCTION

Read the main Gamechanger Dispatch, the 24-Hour Override, and this SEO Gamechanger Override.

Treat this file as authoritative for search architecture.

Do not pause the premium website and playable-level build to create a large blog.

Implement the First 24-Hour SEO Slice alongside the public preview. After deployment, expand character, level, HR-rule, replay/video, and editorial content only through the quality gate.

Update `docs/CODEX-STATUS.md` after each SEO checkpoint with:

- routes created;
- index/noindex decisions;
- metadata status;
- schema status;
- sitemap status;
- robots status;
- performance results;
- rendered proof;
- Search Console/Bing status;
- defects;
- exact next task.

Do not claim traffic, rankings, or viral success without real production data.
