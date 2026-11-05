# Orbit — Self-Hosted SaaS Website Builder

Dark-themed SaaS panel that turns a few business details into a live, responsive website **on your own
domain**: it generates the site, creates the A/CNAME/TXT records you need, runs the SSL checks and tracks
the mapping until the domain resolves. A free `<name>.orbit.local` address is kept only as an internal
preview address.

## Stack
- **Frontend** — React 18 + Vite + Tailwind CSS (dark UI, mobile responsive)
- **Backend** — Node.js + Express (REST API, no external AI calls)
- **Storage** — embedded JSON store (`server/data/db.json`), atomic writes

## Two ways to look at it
1. **`Orbit-Website-Builder.html`** — the whole product in one file. Open it in a browser and click through
   intake → generation → subdomain hosting → DNS/SSL mapping. State lives in `localStorage`.
2. **This repo** — the real React + Express app with a JSON store on disk and server-side host routing.

## Run it
```bash
npm run setup     # installs root, server and client deps
npm run dev       # API on :4000, dashboard on http://localhost:5173
```
Checks: `npm --prefix server test` runs an end-to-end smoke test (22 assertions: build pipeline,
subdomain routing, DNS state machine, custom-domain host routing, rebuild, delete).

Production-ish single port:
```bash
npm run serve     # builds the dashboard, Express serves it on http://localhost:4000
```

## What is real vs simulated
| Layer | Reality |
|---|---|
| Site generation | Real. A deterministic template engine composes HTML/CSS from the intake form — no OpenAI call. |
| Domain connection | Real routing. `POST /api/sites` accepts a `domain`; the record set is created with the site and the host-routing middleware serves that site for any request carrying the mapped `Host` header. |
| DNS + SSL status | Simulated state machine: pending → verified → SSL issuing → live, with per-record statuses. No registrar or ACME call is made. |
| Preview address | Real. `<slug>.orbit.local` and `/sites/:slug` both serve the stored HTML, so you can share a preview before DNS resolves. |

## API
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness |
| GET | `/api/sites` | List sites |
| POST | `/api/sites` | `{businessName, industry, theme, description, city, phone, domain?, slug?}` → builds a site and, when `domain` is given, connects it |
| GET | `/api/sites/:slug` | Site record |
| GET | `/api/sites/:slug/status` | Build progress |
| PUT | `/api/sites/:slug` | Re-generate with edited details |
| DELETE | `/api/sites/:slug` | Remove site |
| GET | `/api/subdomains/check?slug=` | Availability check |
| POST | `/api/sites/:slug/domain` | `{domain}` → connect or replace the site's domain |
| GET | `/api/sites/:slug/domain` | DNS + SSL status |
| POST | `/api/sites/:slug/domain/recheck` | Re-run verification |
| GET | `/sites/:slug` | **The generated website itself** |

Reserved internal slugs: `www, api, app, admin, mail, dashboard, orbit, static, cdn, assets, dev, staging`.
The internal slug is derived from the business name and is never shown as the public address when a domain is connected.
