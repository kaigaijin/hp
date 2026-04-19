import { createClient } from "@supabase/supabase-js";

// サーバーサイド専用クライアント（RLSバイパス）
// クライアントサイドで絶対に使わないこと
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
