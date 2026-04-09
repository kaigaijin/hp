"use client";

import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, X, Loader2, Star, Heart } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type FormMode = "login" | "signup" | "reset";

export default function UserMenu() {
  const { user, loading, signIn, signUp, signOut, displayName } = useAuth();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowForm(false);
        setSignUpSuccess(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // レビューフォームからのログイン要求を受け取る
  useEffect(() => {
    function handleOpenLogin() {
      setShowForm(true);
      setFormMode("login");
      resetForm();
    }
    window.addEventListener("kaigaijin:open-login", handleOpenLogin);
    return () => window.removeEventListener("kaigaijin:open-login", handleOpenLogin);
  }, []);

  function resetForm() {
    setEmail("");
    setPassword("");
    setNickname("");
    setError("");
    setSubmitting(false);
    setSignUpSuccess(false);
    setResetSent(false);
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      setError("送信に失敗しました。メールアドレスを確認してください");
    } else {
      setResetSent(true);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError("");
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
    } else {
      setShowForm(false);
      resetForm();
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !nickname.trim()) return;
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }
    setSubmitting(true);
    setError("");
    const result = await signUp(email.trim(), password, nickname.trim());
    setSubmitting(false);
    if (result.error) {
      if (result.error.includes("already registered")) {
        setError("このメールアドレスは既に登録されています");
      } else {
        setError("登録に失敗しました。入力内容を確認してください");
      }
    } else {
      setSignUpSuccess(true);
    }
  }

  if (loading) {
    return (
      <div className="w-7 h-7 flex items-center justify-center">
        <Loader2 size={14} className="animate-spin text-stone-400" />
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormMode("login");
            resetForm();
          }}
          className="inline-flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 hover:text-warm-600 dark:hover:text-warm-400 transition-colors p-1.5"
          title="ログイン"
        >
          <LogIn size={16} />
          <span className="hidden sm:inline">ログイン</span>
        </button>

        {showForm && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                {formMode === "login" ? "ログイン" : "新規登録"}
              </p>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X size={14} />
              </button>
            </div>

            {signUpSuccess ? (
              <div className="text-sm text-stone-600 dark:text-stone-300 space-y-2">
                <p className="text-green-600 dark:text-green-400 font-medium">
                  登録メールを送信しました
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  メール内のリンクをクリックして登録を完了してください。
                </p>
                <button
                  onClick={() => {
                    setFormMode("login");
                    setSignUpSuccess(false);
                    resetForm();
                  }}
                  className="text-xs text-warm-600 dark:text-warm-400 hover:underline"
                >
                  ログインに戻る
                </button>
              </div>
            ) : formMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  required
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
                />
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting || !email.trim() || !password}
                  className="w-full px-3 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  ログイン
                </button>
                <p className="text-xs text-stone-400 text-center pt-1">
                  アカウントをお持ちでない方は{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode("signup");
                      setError("");
                    }}
                    className="text-warm-600 dark:text-warm-400 hover:underline"
                  >
                    新規登録
                  </button>
                </p>
                <p className="text-xs text-stone-400 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode("reset");
                      setError("");
                    }}
                    className="hover:underline"
                  >
                    パスワードを忘れた方
                  </button>
                </p>
              </form>
            ) : formMode === "reset" ? (
              resetSent ? (
                <div className="text-sm text-stone-600 dark:text-stone-300 space-y-2">
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    リセットメールを送信しました
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    メール内のリンクからパスワードを再設定してください。
                  </p>
                  <button
                    onClick={() => {
                      setFormMode("login");
                      resetForm();
                    }}
                    className="text-xs text-warm-600 dark:text-warm-400 hover:underline"
                  >
                    ログインに戻る
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-2">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    登録済みのメールアドレスにパスワードリセット用のリンクを送ります。
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="メールアドレス"
                    required
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
                  />
                  {error && (
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="w-full px-3 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    リセットメールを送る
                  </button>
                  <p className="text-xs text-stone-400 text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFormMode("login");
                        setError("");
                      }}
                      className="hover:underline"
                    >
                      ログインに戻る
                    </button>
                  </p>
                </form>
              )
            ) : (
              <form onSubmit={handleSignUp} className="space-y-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ニックネーム"
                  required
                  maxLength={30}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード（6文字以上）"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
                />
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting || !email.trim() || !password || !nickname.trim()}
                  className="w-full px-3 py-2 bg-warm-600 text-white text-sm font-medium rounded-lg hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  登録する
                </button>
                <p className="text-xs text-stone-400 text-center pt-1">
                  アカウントをお持ちの方は{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode("login");
                      setError("");
                    }}
                    className="text-warm-600 dark:text-warm-400 hover:underline"
                  >
                    ログイン
                  </button>
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // ログイン済み
  const initials = (displayName ?? "?").slice(0, 1);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        title={displayName ?? undefined}
      >
        <div className="w-7 h-7 rounded-full bg-warm-100 dark:bg-warm-900 flex items-center justify-center">
          <span className="text-xs font-medium text-warm-700 dark:text-warm-300">
            {initials}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-700">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">
              {displayName}
            </p>
          </div>
          <Link
            href="/my-favorites"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            <Heart size={14} />
            お気に入り
          </Link>
          <Link
            href="/my-reviews"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            <Star size={14} />
            マイレビュー
          </Link>
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            <LogOut size={14} />
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
