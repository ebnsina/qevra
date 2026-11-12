# Qevra

A learning platform one academy runs for itself (one setup per academy, not multi-tenant): the
academy's public website, a student portal and an admin area with a CMS for the website.
First setup: DELTA (mydelta.online); its real content is what the seed loads.

SvelteKit 3 + Svelte 5 + TypeScript, one service. Neon (Postgres + Object Storage). Deploys to Vercel.

## Commands
- `pnpm db:up` local Postgres, storage and mail (Docker) · `pnpm db:migrate`
- Seeding (each is safe to rerun): `pnpm db:seed` the website's content only · `pnpm db:seed:sample` also sample
  teaching material (lessons on the academy's public YouTube videos, quizzes, assignments, live classes, study
  sheets) · `pnpm db:seed:demo` all of that plus demo accounts and a free practice course (local and tests only)
- `pnpm admin:create <email> "<name>"` creates a staff account and prints its password once
- `pnpm dev` · `pnpm check` (keep 0 errors, 0 warnings)
- `pnpm test` unit + database tests against `qevra_test` · `pnpm test:e2e` browser flows (starts its own server on 5174)
- Demo logins after seeding: `admin@example.com` / `admin12345`, `student@example.com` / `student12345`

## Layout
- `src/routes/(site)` public website · `(auth)` sign-in · `portal` students · `admin` staff · `files/[...key]` serves uploads
- `src/lib/server` everything that touches the database, storage or mail · `src/lib/components` app pieces · `src/lib/sinaui` copied sinaui (never edit)
- `migrations/*.sql` applied in name order by `scripts/migrate.ts` · `scripts/seed.ts` + `scripts/content/` the
  academy's real content (DELTA): `delta.json` website, `curriculum.json` sample lessons, `resources.ts` study sheets · `.env.production` (git-ignored) holds production's settings
- `neon.ts` declares the storage bucket (`neon deploy` creates it). Neon project `delta`: local work uses its `dev`
  branch (`.env`); `production` is untouched until the first deploy. Tests use the local Docker database (`.env.test`).
- `.mcp.json` Neon MCP server (signs in with OAuth on first use) · `.agents/skills` Neon agent skills

## Rules that are easy to break
- **Every query goes through `locals.db(tx => …)`** (or `db(actor, …)`): it sets who is asking, and row-level security
  decides what they see. The app connects as `DATABASE_APP_URL` (role `qevra_app`); the owner `DATABASE_URL` is for
  migrations and the seed only. Never use the owner in app code: it bypasses row-level security.
- `db('system', …)` is only for sign-in and bookkeeping no person may do directly (sessions, completing lessons,
  issuing certificates, checking a certificate number).
- `hooks.server.ts` is the only gate for `/portal` (signed in) and `/admin` (admin role).
- A schema change is a **new** file in `migrations/`; never edit one that has been applied.
- Kit 3: import `#lib/...` with the file extension (`#lib/format.ts`); config lives in `vite.config.ts`; env vars are
  declared in `src/env.ts` and imported from `$app/env/private`.
- Errors shown to people are codes mapped in `src/lib/messages.ts`, never raw error text.
- Uploads pass through the app and are capped at 4 MB (Vercel's request limit); see the note in `storage.ts`.
- A course with `enrollment_open` off is listed as "Coming soon" and can't be joined or paid for; the seed leaves
  courses closed until they have lessons.
- Money is whole taka; dates and numbers format through `src/lib/format.ts` (Bangladesh time).

## Design
- Website: Clash Display headings, Amulya text (self-hosted in `static/fonts`), white with one brand color
  (cobalt `#0047ab` by default, set per academy in Site settings). Tinted sections and `.site-card` cards.
  It is the academy's own site: content about the academy, not about the software.
- Portal and admin: Geist, on sinaui's **Studio block** (`src/lib/sinaui/blocks/studio`): `AppShell.svelte` wraps
  `Studio` (sidebar with search, breadcrumbs, account menu, bottom tab bar on phones); pages use its `PageHeader`,
  `Stat`, `RowLink`, and a wide side sheet per table row.
- The Studio block and `SidebarLayout`'s `tabs` live on sinaui's local `studio-block` branch (not on main yet). To
  re-copy: run `pnpm dev --port 5199` in `~/Sites/sinaui`, then
  `SINAUI_REGISTRY=http://localhost:5199 node ~/Sites/sinaui/cli/index.js add blocks/studio --overwrite`.
- Admin forms are lists of `Field`s (`components/fields.ts`) rendered by `Fields`, `CrudSheet` and `CrudPage`.
