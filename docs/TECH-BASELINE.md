# Technical Baseline

Verified against official sources on 2026-07-29.

| Component | Pinned version | Rationale |
| --- | ---: | --- |
| Node.js | 24.18.0 LTS | Production LTS line |
| pnpm | 11.18.0 | Reproducible workspace package manager |
| Next.js | 16.2.12 | Current patched stable App Router baseline |
| React / React DOM | 19.2.8 | Exact matching stable pair |
| Phaser | 4.2.1 | Current web-native game runtime |
| TypeScript | 6.0.3 | Retains tooling API compatibility; TS 7 deferred |
| Playwright Test | 1.62.0 | Browser, visual, and interaction proof |
| Vitest | 4.1.10 | Pure deterministic core and component-contract tests |

The current machine has Node 24.15.0 and pnpm 11.9.0. They are on the correct major
lines but below the repository pins; local checkpoint results must identify that fact.

Primary references:

- https://nodejs.org/en/about/previous-releases
- https://nodejs.org/en/blog/release/v24.18.0
- https://nextjs.org/blog/next-16-2
- https://nextjs.org/docs/app
- https://react.dev/versions
- https://www.npmjs.com/package/phaser
- https://www.npmjs.com/package/typescript
- https://playwright.dev/docs/release-notes
- https://playwright.dev/docs/test-snapshots
- https://vitest.dev/guide/migration

Compatibility decisions:

- Phaser is imported only from client code; deterministic state never depends on a
  Phaser scene object.
- Vitest covers pure TypeScript. Playwright will cover async server components, the
  integrated game, PWA flows, and visual snapshots.
- TypeScript 7 is deferred until stable Next.js integration no longer depends on the
  removed programmatic API.
