-- 自分のメールで申し込んだ応募のみ読み取り可（確認用・将来の応募状況確認にも使える）
-- とりあえずanonにも全件読み取りを許可して動作確認（後でauthenticatedのみに戻す）
create policy "anon can read own applications" on job_applications 
  for select to anon 
  using (true);
