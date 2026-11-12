-- Lesson Q&A, course reviews, lesson downloads, personal notes, announcements, coupons and regular prices.

-- Is the person asking enrolled? These read their own enrollment, which row-level security lets them see.
create function app_enrolled_in_course(course uuid) returns boolean language sql stable as
  $$ select exists (select 1 from enrollments e where e.course_id = course and e.user_id = app_user_id()) $$;
create function app_enrolled_in_lesson(lesson uuid) returns boolean language sql stable as
  $$ select exists (select 1 from lessons l where l.id = lesson and app_enrolled_in_course(l.course_id)) $$;

-- Questions under a lesson (parent_id is null) and the replies to them.
-- The author's name is copied in, so classmates can read a thread without being able to read each other's accounts.
create table lesson_posts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  user_id uuid not null references users on delete cascade,
  parent_id uuid references lesson_posts on delete cascade,
  author_name text not null,
  by_staff boolean not null default false,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index on lesson_posts (lesson_id, created_at);
alter table lesson_posts enable row level security;
create policy lesson_posts_read on lesson_posts for select using (app_is_staff() or app_enrolled_in_lesson(lesson_id));
create policy lesson_posts_write on lesson_posts for insert
  with check (user_id = app_user_id() and (app_is_staff() or (app_enrolled_in_lesson(lesson_id) and not by_staff)));
create policy lesson_posts_delete on lesson_posts for delete using (app_is_staff() or user_id = app_user_id());

-- A student's rating of a course. Public once staff approve it; editing sends it back for approval.
create table course_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users on delete cascade,
  course_id uuid not null references courses on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null default '' check (length(body) <= 2000),
  author_name text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
alter table course_reviews enable row level security;
create policy course_reviews_read on course_reviews for select using (approved or app_is_staff() or user_id = app_user_id());
create policy course_reviews_write on course_reviews for insert
  with check (user_id = app_user_id() and not approved and app_enrolled_in_course(course_id));
create policy course_reviews_edit on course_reviews for update
  using (user_id = app_user_id()) with check (user_id = app_user_id() and not approved);
create policy course_reviews_staff on course_reviews for all using (app_is_staff()) with check (app_is_staff());

-- Files attached to a lesson. The rows are content; the files themselves are served only to enrolled students.
create table lesson_files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  title text not null,
  file_key text not null,
  file_name text not null,
  position integer not null default 0
);
create index on lesson_files (lesson_id);
alter table lesson_files enable row level security;
create policy lesson_files_read on lesson_files for select using (true);
create policy lesson_files_admin on lesson_files for all using (app_role() = 'admin') with check (app_role() = 'admin');

-- A student's private notes on a lesson. Nobody else reads them, staff included.
create table lesson_notes (
  user_id uuid not null references users on delete cascade,
  lesson_id uuid not null references lessons on delete cascade,
  body text not null check (length(body) <= 10000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table lesson_notes enable row level security;
create policy lesson_notes_own on lesson_notes for all using (user_id = app_user_id()) with check (user_id = app_user_id());

-- News from the teacher to everyone in a course.
create table announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);
create index on announcements (course_id, created_at desc);
alter table announcements enable row level security;
create policy announcements_read on announcements for select using (app_is_staff() or app_enrolled_in_course(course_id));
create policy announcements_admin on announcements for all using (app_role() = 'admin') with check (app_role() = 'admin');

-- Offers: a regular price to show struck through, and discount codes.
alter table courses add column regular_price integer check (regular_price is null or regular_price >= 0);
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  percent_off integer not null check (percent_off between 1 and 100),
  course_id uuid references courses on delete cascade, -- null: any course
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table coupons enable row level security;
-- Only staff can list coupons. Students check one code at a time through coupon_for().
create policy coupons_staff on coupons for all using (app_role() = 'admin') with check (app_role() = 'admin');
alter table payments add column coupon_id uuid references coupons on delete set null;

-- The discount a code gives on a course right now, or no row when it can't be used: unknown, switched off,
-- for another course, expired, or used up. Runs as the owner because students can't read coupons or
-- other people's payments.
create function coupon_for(p_code text, p_course uuid) returns table (id uuid, percent_off integer)
language sql stable security definer set search_path = public as $$
  select c.id, c.percent_off from coupons c
  where c.code = p_code::citext and c.active
    and (c.course_id is null or c.course_id = p_course)
    and (c.expires_at is null or c.expires_at > now())
    and (c.max_uses is null
      or (select count(*) from payments p where p.coupon_id = c.id and p.status <> 'rejected') < c.max_uses)
$$;
