create extension if not exists pgcrypto;

create table job_submissions (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  country text not null,
  industry text not null,
  company text not null,
  title text not null,
  payload jsonb not null,
  contact_email text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- RLS: insertはanon可、selectは認証済みのみ
alter table job_submissions enable row level security;
create policy "anon can insert" on job_submissions for insert to anon with check (true);
create policy "auth can select" on job_submissions for select to authenticated using (true);
