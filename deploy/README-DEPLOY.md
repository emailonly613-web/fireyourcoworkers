# Deploying fireyourcoworkers.com

The production site is a prebuilt static export of the Fire Your Coworkers Next.js app.
DigitalOcean serves the committed `public-preview/` directory; it does not run a Node
service or perform a production build.

## Build and verify

```powershell
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
node scripts/build-static-preview.mjs
```

The static builder defaults metadata and social URLs to
`https://fireyourcoworkers.com`. Set `FYC_PUBLIC_ORIGIN` only when intentionally
building the same artifact for another reviewed host.

## Production deployment

Production app ID: `8678783b-ec62-49d2-9758-b29d074c34e8`.

1. Commit and push the verified `public-preview/` tree to `main`.
2. Review the proposed change:

   ```powershell
   doctl apps propose --app 8678783b-ec62-49d2-9758-b29d074c34e8 --spec deploy/do-app.yaml
   ```

3. Update the existing app in place:

   ```powershell
   doctl apps update 8678783b-ec62-49d2-9758-b29d074c34e8 `
     --spec deploy/do-app.yaml --update-sources --wait
   ```

Updating the existing app preserves the apex and `www` domain attachments. No DNS
change is part of an ordinary release.

## Required live checks

- Apex and `www` load the new cinematic homepage over HTTPS.
- The integrated game accepts valid moves and rejects invalid moves.
- Manifest, service worker, icons, Open Graph image, and build assets return successfully.
- Open Graph URL and image use `https://fireyourcoworkers.com`.
- Desktop and mobile have no horizontal overflow or browser-console errors.
- The installed starter level survives an offline reload after one online visit.

## Rollback

The baseline tag `codex-takeover-baseline-2026-07-29` and the pre-cutover deployment
reference under `proof/production-cutover/` identify the rejected legacy build. Roll back
to that successful DigitalOcean deployment if the replacement fails its live gates.
