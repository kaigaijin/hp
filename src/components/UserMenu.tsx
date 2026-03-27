"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LogIn, LogOut, User } from "lucide-react";

export default function UserMenu() {
  const { user, loading, signInWithGoogle, signOut, displayName } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
    );
  }

  // 未ログイン
  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
        title="Googleでログイン"
      >
        <LogIn size={16} />
        <span className="hidden sm:inline">ログイン</span>
      </button>
    );
  }

  // ログイン中
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = (displayName ?? "?").slice(0, 1);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        title={displayName ?? "アカウント"}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-7 h-7 rounded-full border border-stone-200 dark:border-stone-600"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-ocean-100 dark:bg-ocean-900 flex items-center justify-center">
            <span className="text-xs font-medium text-ocean-700 dark:text-ocean-300">
              {initials}
            </span>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-700">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">
              {displayName}
            </p>
            <p className="text-xs text-stone-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
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
