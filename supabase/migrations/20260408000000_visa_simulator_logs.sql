create table visa_simulator_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  age int,
  annual_income_man int,
  assets_man int,
  employment text,
  target_countries text[],
  ok_count int,
  maybe_count int
);

alter table visa_simulator_logs enable row level security;
create policy "insert only" on visa_simulator_logs for insert with check (true);
