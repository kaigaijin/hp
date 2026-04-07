create table jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  country text not null,
  industry text not null,
  company text not null,
  company_ja text,
  title text not null,
  job_type text not null,
  employment_type text not null,
  location text not null,
  nearest_station text,
  salary_min integer,
  salary_max integer,
  salary_currency text default 'USD',
  salary_type text default 'monthly',
  language_requirement text,
  description text not null,
  detail text,
  requirements text,
  benefits text,
  contact_email text,
  contact_url text,
  company_website text,
  tags text[] default '{}',
  status text default 'active',
  source text default 'user_submitted',
  posted_at date default current_date,
  expires_at date,
  last_verified date default current_date,
  priority integer default 0,
  created_at timestamptz default now(),
  unique(country, industry, slug)
);

-- インデックス
create index jobs_country_industry_idx on jobs(country, industry);
create index jobs_status_idx on jobs(status);

-- RLS: 読み取りはanon可、書き込みはservice_role（APIルート経由）
alter table jobs enable row level security;
create policy "anon can read active jobs" on jobs for select to anon using (status != 'closed');
create policy "anon can insert jobs" on jobs for insert to anon with check (true);
