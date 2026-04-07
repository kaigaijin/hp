-- Fix RLS policy for job_applications
-- Drop and recreate to ensure it's applied correctly
drop policy if exists "anon can insert" on job_applications;
drop policy if exists "auth can select" on job_applications;
drop policy if exists "service role can select" on job_applications;

create policy "anon can insert" on job_applications for insert to anon with check (true);
create policy "auth can select" on job_applications for select to authenticated using (true);
