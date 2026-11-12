# Qevra

A learning platform an academy runs for itself: its public website, a student portal and an admin
area, in one app. Built for academies that sell recorded courses with live classes and take payment
by bKash or Nagad.

## Features

**Website (the academy's own)**
- Home, courses, course pages, reviews, free resources, blog, About, Contact and Privacy pages
- Course pages with a free preview lesson, what you'll learn, the lesson list and an enroll card
- Everything editable by staff: texts, logo, brand color, partner logos, reviews, posts, pages

**Student portal**
- Enroll by sending the fee with bKash or Nagad and entering the transaction ID; free courses start at once
- Recorded lessons (YouTube, Vimeo or Bunny Stream), notes, quizzes marked on the spot, assignments with teacher feedback
- Live classes with a Join link (Zoom or Google Meet) and recordings afterwards
- Progress per course, and a certificate with a number anyone can check once every lesson is done

**Admin**
- Confirm or decline payments; confirming opens the course
- Courses, sections, lessons, quizzes, live classes
- Students and their progress; open a course for a student without payment
- Review assignments with a grade and feedback
- The website's content (CMS)

## Getting started

Requirements: Node 24, pnpm, and Docker for the local database.

```sh
pnpm install
cp .env.example .env     # the defaults match the local services
pnpm db:up               # Postgres, storage and a mail catcher (http://localhost:8026)
pnpm db:migrate
pnpm db:seed:demo        # the academy's content, plus demo accounts and sample lessons
pnpm dev                 # http://localhost:5173
```

Demo accounts: `admin@example.com` / `admin12345` and `student@example.com` / `student12345`.

### Configuration

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres owner connection. Used only by `db:migrate` and `db:seed`. |
| `DATABASE_APP_URL` | What the app runs as: the same address with the user `qevra_app` and a password you choose. `db:migrate` creates that role. |
| `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3-compatible storage for uploads (Neon Object Storage). |
| `MAIL_SMTP_URL`, `MAIL_FROM` | SMTP account for password-reset emails. |

The app refuses to start if one is missing.

### Using Neon

```sh
npx neon login
npx neon link                  # choose the project
npx neon checkout dev --create # a dev branch with its own data and files; writes DATABASE_URL and AWS_* to .env
```

Then set `DATABASE_APP_URL` in `.env`: copy `DATABASE_URL`, change the user to `qevra_app` and choose a
password. Run `pnpm db:migrate` (it creates that user), then `pnpm db:seed:demo`.

Production has its own steps: see Deployment.

## Development

```sh
pnpm check       # types
pnpm test        # unit tests, and database tests against a real Postgres (the qevra_test database)
pnpm test:e2e    # browser tests of the main flows
```

- `src/routes/(site)` website, `src/routes/portal` students, `src/routes/admin` staff
- `src/lib/server` database, sign-in, storage, mail
- `migrations/` SQL migrations, applied in order by `pnpm db:migrate`

Students only ever see their own records: that is enforced in the database with row-level security,
not only in the app. See `CLAUDE.md` for the conventions.

## Deployment

Built for Vercel with Neon. The app's functions run in Singapore (`sin1`), next to the database.

1. **Database and storage.** On the production branch: `npx neon deploy --branch production` creates the
   `files` bucket, and `npx neon env pull --branch production --file .env.production` writes its settings
   to a file git ignores. Add `DATABASE_APP_URL` to that file (see Configuration).
2. **Schema and content.** `node --env-file=.env.production scripts/migrate.ts`, then
   `node --env-file=.env.production scripts/seed.ts` for the academy's content. Add `--sample` to also load
   sample lessons, quizzes, assignments and study sheets for showing the platform to the academy. Never
   add `--demo` here: its accounts have published passwords.
3. **First admin.** `node --env-file=.env.production scripts/create-admin.ts you@example.com "Your Name"`
   prints a password once. Sign in and change it under Profile.
4. **Vercel.** Import the repository, then add these variables to the project (Vercel can import
   `.env.production`): `DATABASE_APP_URL`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
   `AWS_SECRET_ACCESS_KEY`, `MAIL_SMTP_URL`, `MAIL_FROM`. The app does not need `DATABASE_URL` (the owner
   connection): leave it out of Vercel.
5. **Open the courses.** Courses are seeded as "Coming soon". Add lessons in the admin area, then switch
   each course on with "Open for enrollment".

Uploads are limited to 4 MB each, the size Vercel accepts in one request.

## License

Not licensed for reuse yet.
