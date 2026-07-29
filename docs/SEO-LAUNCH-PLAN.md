# Fire Your Coworkers — SEO Launch Plan

Date: 2026-07-29

Authority: `DISPATCHES/FIRE-YOUR-COWORKERS-SEO-GAMECHANGER-OVERRIDE.md`.

## Precedence

The SEO override is authoritative for search architecture. It expands the public-
preview acceptance gate but does not replace the master product contract, the six
24-hour checkpoints, or the founder-review pause after the living hero. SEO work must
ship alongside the premium website and playable level; it may not displace them with a
blog or thin programmatic pages.

## First launch inventory

Planned indexable routes:

- `/`
- `/play`
- `/how-to-play`
- `/characters`
- `/characters/sleeping-intern`
- `/characters/micro-managing-ceo`
- `/characters/broken-copy-machine`
- `/levels`
- `/levels/mandatory-elevator-meeting`
- `/hr-violations`
- `/hr-violations/improper-employee-orientation`
- `/hr-violations/unsafe-equipment-stacking`
- `/hr-violations/unscheduled-executive-contact`
- `/about`
- `/support`
- `/privacy`
- `/terms`

Planned `noindex, follow` or unpublished routes until the quality gate is met:

- Private or tokenized challenge URLs: `noindex, follow`, canonical to `/play` or the relevant public level.
- Random user replay IDs: unpublished or `noindex, follow`.
- `/replays`: index only after it has useful curated replay content.
- `/updates`: index only after it has a genuine published update.
- Search-intent landing pages: unpublished until each has distinct, useful content and current research.
- Account, checkout, preview, staging, and internal routes: noindex or blocked from publication as appropriate.

No replay page, `VideoObject`, or video sitemap will be fabricated before a real,
prominent, captioned clip exists. `SoftwareApplication` schema will not ship until the
visible playable/PWA claims and required fields are truthful.

## Implementation sequence after hero approval

1. Create a typed metadata and canonical generator for every public route.
2. Add a visible H1, server-rendered explanatory copy, and crawlable internal links.
3. Build the three character pages, one level page, and three fictional HR-rule pages from one validated content model.
4. Add accurate `WebSite`, `Organization`, and deep-page `BreadcrumbList` JSON-LD.
5. Add unique crawlable images and page-specific Open Graph output.
6. Generate robots, sitemap index, page/character/level/image sitemaps, and video sitemap only when applicable.
7. Add real 404/status behavior, canonical host and query rules, and private-route index controls.
8. Prepare environment-based Google and Bing verification plus a fail-closed IndexNow publisher that rejects private URLs.
9. Add Playwright and direct-response tests for metadata, canonicals, status codes, server HTML, structured data, sitemaps, and crawlable links.
10. Produce rendered-HTML, JavaScript-disabled, Lighthouse, link, schema, redirect, mobile, and desktop evidence after deployment.

## Non-claims

Implementation proof is not ranking, traffic, virality, or search-volume proof. No fake
ratings, reviews, prices, engagement figures, search volumes, or schema will be used.
Search Console, Bing, IndexNow, and field-performance status remain pending until the
replacement site is deployed and the necessary production access exists.
