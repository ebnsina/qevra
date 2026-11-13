# Tadris

A learning platform one academy runs for itself (one setup per academy, not multi-tenant): the
academy's public website, a student portal and an admin area with a CMS for the website.
The seed loads a generic sample academy ("Lisan Academy"); a real academy replaces it in the admin area.

SvelteKit 3 + Svelte 5 + TypeScript, one service. Neon (Postgres + Object Storage). Deploys to Vercel.

## Commands
- `pnpm db:up` local Postgres, storage and mail (Docker) · `pnpm db:migrate`
- Seeding (each is safe to rerun): `pnpm db:seed` the website's content only · `pnpm db:seed:sample` also sample
  teaching material (lessons with license-free placeholder films, quizzes, assignments, live classes, study
  sheets) · `pnpm db:seed:demo` all of that plus demo accounts (local and tests only) · `pnpm db:seed:activity` 640 demo students with payments, progress and reviews (`db:seed:activity:clear` removes them) · `pnpm db:seed:showcase <student email>` gives one existing student a full history for a demo
- `pnpm admin:create <email> "<name>"` creates a staff account and prints its password once
- `pnpm dev` · `pnpm check` (keep 0 errors, 0 warnings)
- `pnpm test` unit + database tests against `tadris_test` · `pnpm test:e2e` browser flows (starts its own server on 5174)
- Demo logins after seeding: `admin@example.com` / `admin12345`, `student@example.com` / `student12345`

## Layout
- `src/routes/(site)` public website · `(auth)` sign-in · `portal` students · `admin` staff · `files/[...key]` serves uploads
- `src/lib/server` everything that touches the database, storage or mail · `src/lib/components` app pieces · `src/lib/sinaui` copied sinaui (never edit)
- `migrations/*.sql` applied in name order by `scripts/migrate.ts` · `scripts/seed.ts` + `scripts/content/` the
  sample academy: `academy.json` website, `curriculum.json` sample lessons, `resources.ts` study sheets · `.env.production` (git-ignored) holds production's settings
- `neon.ts` declares the storage bucket (`neon deploy` creates it). The Neon project is the one linked in `.neon`: local work uses its `dev`
  branch (`.env`); `production` is untouched until the first deploy. Tests use the local Docker database (`.env.test`).
- `.mcp.json` Neon MCP server (signs in with OAuth on first use) · `.agents/skills` Neon agent skills

## Rules that are easy to break
- **Every query goes through `locals.db(tx => …)`** (or `db(actor, …)`): it sets who is asking, and row-level security
  decides what they see. The app connects as `DATABASE_APP_URL` (a restricted role, `tadris_app` locally; the hosted databases still use `qevra_app`); the owner `DATABASE_URL` is for
  migrations and the seed only. Never use the owner in app code: it bypasses row-level security.
- **Admin screens read and save through TanStack Query** (`src/lib/admin-query.svelte.ts`): `adminPage(() => loaded)` for the
  screen's data, `mutating(done, optimistic)` for each save, `<form onsubmit={x.submit}>`. Saves still post to the page's
  form actions; refetches come from `/admin/data/<screen>`, which runs that screen's own `load`. Never add `use:enhance`
  or read the `data` prop directly in `/admin`. The portal and website keep plain form actions.
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
- Website: Sora headings (bold) and Cabin text (its @ swapped for Geist Mono's) (self-hosted through `@fontsource-variable`), white with one brand color
  (blue `#2563eb` by default, the same on light and dark, set per academy in Site settings). Tinted sections and `.site-card` cards.
  It is the academy's own site: content about the academy, not about the software.
- Radii follow size (`--radius-sm` chips and tiles, `--ui-radius-control` buttons and fields, `--ui-radius` cards and dialogs,
  `--radius-xl` full-width bands). Surfaces lift with shadows, not outlines; no decorative grid patterns. Covers are
  Unsplash photos kept in `scripts/content/covers` (800 × 420 WebP); the sign-in photo is in `static/images`. People in photos: women shown wear hijab.
- Portal and admin: the same font at calmer weights, on sinaui's **Studio block** (`src/lib/sinaui/blocks/studio`): `AppShell.svelte` wraps
  `Studio` (sidebar with search, breadcrumbs, account menu, bottom tab bar on phones); pages use its `PageHeader`,
  `Stat`, `RowLink`, and a wide side sheet per table row.
- The Studio block and `SidebarLayout`'s `tabs` live on sinaui's local `studio-block` branch (not on main yet). To
  re-copy: run `pnpm dev --port 5199` in `~/Sites/sinaui`, then
  `SINAUI_REGISTRY=http://localhost:5199 node ~/Sites/sinaui/cli/index.js add blocks/studio --overwrite`.
- Admin forms are lists of `Field`s (`components/fields.ts`) rendered by `Fields`. Small records (testimonials,
  coupons, lessons) edit in a side sheet (`CrudSheet`, `CrudPage`); posts, pages and course details edit on a full
  page (`EditorPage`, at `/admin/<list>/[id]`, with `new` for a new one). Rich text is saved as HTML; older text is
  Markdown, and `renderMarkdown` handles both.
- Row-level security also covers Q&A (`lesson_posts`: enrolled students only), private notes (`lesson_notes`: the
  writer only, not even staff) and reviews (`course_reviews`: public once approved). Students can't read `coupons`;
  a code is checked through the `coupon_for()` database function.
