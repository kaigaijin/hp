import { createClient } from "@supabase/supabase-js";

// サーバーサイド専用クライアント（RLSバイパス）
// クライアントサイドで絶対に使わないこと
export function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        // Googlebotクロール時のタイムアウト→5xx防止（Vercel Serverless上限10秒を考慮）
        fetch: (url, options) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          return fetch(url, { ...options, signal: controller.signal }).finally(
            () => clearTimeout(timer)
          );
        },
      },
    }
  );
}
