-- 管理者（authenticated）がDELETE可能にする
create policy "auth can delete" on job_applications
  for delete to authenticated
  using (true);

-- anonのselectは削除（管理者のみ読み取り可に戻す）
drop policy if exists "anon can read own applications" on job_applications;
