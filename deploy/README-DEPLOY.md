# Deploying fireyourcoworkers.com

The entire game is **one static file**: `web/index.html`. No build step, no server code,
no dependencies. Anything that can serve a static file can serve the game.

## Option A — DigitalOcean App Platform static site (recommended)

1. Push this repo to GitHub (or GitLab). Only `web/` matters for serving.
2. DigitalOcean → **Create → Apps → static site**, point it at the repo.
   - Source directory: `web`
   - No build command. Output dir: `web`.
   - Or use the included `deploy/do-app.yaml` as an App Spec.
3. App Platform gives you an `*.ondigitalocean.app` URL immediately — verify the game
   there FIRST (R0: proof before claim).
4. Domains tab → add `fireyourcoworkers.com` and `www.fireyourcoworkers.com`.
5. At the registrar, set nameservers to DigitalOcean:
   `ns1.digitalocean.com`, `ns2.digitalocean.com`, `ns3.digitalocean.com`
6. In DO **Networking → Domains**, the app adds the records automatically when the
   domain is attached to the app. SSL is automatic (Let's Encrypt).

## Option B — any droplet / any static host

Copy `web/index.html` to the web root. Done. (nginx: `root /var/www/fyc;`)

## Post-deploy verification checklist (run before telling anyone it's live)

- [ ] `https://fireyourcoworkers.com` loads over HTTPS, no console errors
- [ ] Point the E2E harness at production:
      `set FYC_URL=https://fireyourcoworkers.com && node web/e2e.mjs`
      (harness uses the local file unless FYC_URL is set — see e2e.mjs)
- [ ] Play floor 1 on a real phone over cellular, sound on
- [ ] Coins persist across a page reload (localStorage)

## Stripe (later milestone — needs the owner's account)

The economy is already structured for it: `SKINS` and `EXEC_PACK` in `web/index.html`
form the catalog; `owns()` / `wallet.owned` is the entitlement check. When Stripe is
wired:
1. Each catalog item gets a Stripe Price ID.
2. "Instant unlock" button → Stripe Checkout (hosted page; no card data touches us).
3. A tiny webhook (DO Function or droplet) marks the entitlement server-side; the
   client polls/refreshes entitlements on load.
4. Until then the shop truthfully says: "Real-money instant unlocks arrive at launch."

Do NOT add ad SDKs or purchases before the site is live and measured — v2 dispatch
order: analytics (step 4) → ads (9) → purchases (11).
