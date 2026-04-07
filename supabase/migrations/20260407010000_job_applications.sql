create table job_applications (
  id uuid primary key default gen_random_uuid(),
  job_slug text not null,
  job_title text not null,
  country text not null,
  industry text not null,
  applicant_name text not null,
  applicant_email text not null,
  message text,
  created_at timestamptz default now()
);

alter table job_applications enable row level security;
create policy "anon can insert" on job_applications for insert to anon with check (true);
create policy "auth can select" on job_applications for select to authenticated using (true);
