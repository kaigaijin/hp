"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false); // セッション確立待ち

  // Supabaseはリセットリンクをクリックするとフラグメントにアクセストークンを付与して
  // リダイレクトしてくる。onAuthStateChange で SIGNED_IN / PASSWORD_RECOVERY を検知する
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // 既にセッションがある場合も対応
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError("更新に失敗しました。リンクの有効期限が切れている可能性があります");
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-sm">
        {done ? (
          <div className="text-center space-y-3">
            <CheckCircle size={36} className="text-green-500 mx-auto" />
            <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
              パスワードを更新しました
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              3秒後にトップページに戻ります
            </p>
          </div>
        ) : !ready ? (
          <div className="text-center space-y-3">
            <Loader2 size={28} className="animate-spin text-stone-400 mx-auto" />
            <p className="text-xs text-stone-400 dark:text-stone-500">
              セッションを確認しています…
            </p>
            <p className="text-xs text-stone-300 dark:text-stone-600">
              メール内のリンクから直接アクセスしてください
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={18} className="text-warm-600 dark:text-warm-400" />
              <h1 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                新しいパスワードを設定
              </h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="新しいパスワード（6文字以上）"
                required
                minLength={6}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="パスワードを再入力"
                required
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
              />
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !password || !confirm}
                className="w-full px-3 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                パスワードを更新する
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
