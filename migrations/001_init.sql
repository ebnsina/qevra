create extension if not exists citext;

-- Who is asking: set per transaction by the app (src/lib/server/db.ts).
create function app_user_id() returns uuid language sql stable as
  $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;
create function app_role() returns text language sql stable as
  $$ select coalesce(nullif(current_setting('app.role', true), ''), 'anon') $$;
create function app_is_staff() returns boolean language sql stable as
  $$ select app_role() in ('admin', 'system') $$;

-- Accounts
create table users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  name text not null,
  phone text not null default '',
  password_hash text not null,
  role text not null default 'student' check (role in ('admin', 'student')),
  created_at timestamptz not null default now()
);
create table sessions (
  id text primary key, -- sha256 of the cookie token
  user_id uuid not null references users on delete cascade,
  expires_at timestamptz not null
);
create table password_resets (
  id text primary key, -- sha256 of the emailed token
  user_id uuid not null references users on delete cascade,
  expires_at timestamptz not null
);
create table login_attempts (
  email citext not null,
  failed_at timestamptz not null default now()
);
create index on login_attempts (email, failed_at);

-- Courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  outcomes text not null default '', -- what students will learn, one per line
  requirements text not null default '', -- one per line
  level text not null default '',
  price integer not null default 0 check (price >= 0), -- whole taka
  image_key text,
  published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  position integer not null default 0
);
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  module_id uuid not null references modules on delete cascade,
  title text not null,
  position integer not null default 0,
  video_url text not null default '',
  body text not null default '',
  assignment text not null default '', -- the task; empty means no assignment
  is_preview boolean not null default false
);
create index on lessons (course_id);
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  question text not null,
  options text[] not null check (cardinality(options) between 2 and 4),
  correct integer not null,
  position integer not null default 0,
  check (correct >= 0 and correct < cardinality(options))
);
create index on quiz_questions (lesson_id);
create table live_classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  meeting_url text not null,
  recording_url text not null default ''
);
create index on live_classes (course_id, starts_at);

-- Student records. A course or lesson with student records can't be deleted (restrict).
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users on delete cascade,
  course_id uuid not null references courses on delete restrict,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users on delete cascade,
  course_id uuid not null references courses on delete restrict,
  method text not null check (method in ('bkash', 'nagad')),
  sender_number text not null,
  transaction_id text not null,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create unique index payments_one_pending on payments (user_id, course_id) where status = 'pending';
create unique index payments_transaction_once on payments (method, transaction_id) where status <> 'rejected';
create table lesson_progress (
  user_id uuid not null references users on delete cascade,
  lesson_id uuid not null references lessons on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users on delete cascade,
  lesson_id uuid not null references lessons on delete cascade,
  score integer not null,
  total integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index on quiz_attempts (user_id, lesson_id);
create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users on delete cascade,
  lesson_id uuid not null references lessons on delete restrict,
  file_key text not null,
  file_name text not null,
  note text not null default '',
  grade text not null default '',
  feedback text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (user_id, lesson_id)
);
create table certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references users on delete cascade,
  course_id uuid not null references courses on delete restrict,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- Website content
create table site_content (
  key text primary key,
  value jsonb not null
);
create table reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  affiliation text not null default '',
  body text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  position integer not null default 0
);
create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_key text not null,
  position integer not null default 0
);
create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  file_key text not null,
  file_name text not null,
  position integer not null default 0
);
create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  image_key text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default ''
);

-- Row-level security: students see only their own records; only staff write most of them.
alter table users enable row level security;
create policy users_read on users for select using (app_is_staff() or id = app_user_id());
create policy users_insert on users for insert with check (app_is_staff());
create policy users_update on users for update
  using (app_is_staff() or id = app_user_id())
  with check (app_is_staff() or (id = app_user_id() and role = 'student'));
create policy users_delete on users for delete using (app_is_staff());

alter table sessions enable row level security;
create policy sessions_system on sessions for all using (app_role() = 'system') with check (app_role() = 'system');
alter table login_attempts enable row level security;
create policy login_attempts_system on login_attempts for all using (app_role() = 'system') with check (app_role() = 'system');
alter table password_resets enable row level security;
create policy password_resets_system on password_resets for all using (app_role() = 'system') with check (app_role() = 'system');

do $$
declare t text;
begin
  foreach t in array array['enrollments', 'payments', 'lesson_progress', 'quiz_attempts', 'submissions', 'certificates'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (app_is_staff() or user_id = app_user_id())', t || '_read', t);
    execute format('create policy %I on %I for all using (app_is_staff()) with check (app_is_staff())', t || '_staff', t);
  end loop;
  -- Content: anyone reads, only an admin writes.
  foreach t in array array['courses', 'modules', 'lessons', 'quiz_questions', 'live_classes', 'site_content', 'reviews', 'partners', 'resources', 'posts', 'pages'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (true)', t || '_read', t);
    execute format('create policy %I on %I for all using (app_role() = ''admin'') with check (app_role() = ''admin'')', t || '_admin', t);
  end loop;
end $$;

-- What a student may write themselves.
create policy payments_submit on payments for insert with check (user_id = app_user_id() and status = 'pending');
create policy quiz_attempts_submit on quiz_attempts for insert with check (user_id = app_user_id());
create policy submissions_submit on submissions for insert with check (user_id = app_user_id() and reviewed_at is null);
create policy submissions_resubmit on submissions for update
  using (user_id = app_user_id() and reviewed_at is null)
  with check (user_id = app_user_id() and reviewed_at is null and grade = '' and feedback = '');
