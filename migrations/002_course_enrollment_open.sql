-- A course can be listed on the website before it can be joined ("coming soon").
alter table courses add column enrollment_open boolean not null default true;
