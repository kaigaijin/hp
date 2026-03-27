"use client";

import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, User, X } from "lucide-react";

// ニックネームをlocalStorageで管理
function getSavedNickname(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kaigaijin_nickname") || null;
}

function saveNickname(name: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("kaigaijin_nickname", name);
  }
}

function clearNickname() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("kaigaijin_nickname");
  }
}

export default function UserMenu() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNickname(getSavedNickname());
  }, []);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowInput(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSetNickname(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    saveNickname(trimmed);
    // レビュー用のnameも同期
    localStorage.setItem("kaigaijin_reviewer_name", trimmed);
    setNickname(trimmed);
    setShowInput(false);
    setInputValue("");
  }

  function handleLogout() {
    clearNickname();
    setNickname(null);
    setOpen(false);
  }

  // 未ログイン
  if (!nickname) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setShowInput(!showInput)}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
          title="ニックネームを設定"
        >
          <LogIn size={16} />
          <span className="hidden sm:inline">ログイン</span>
        </button>

        {showInput && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                ニックネームを入力
              </p>
              <button
                onClick={() => setShowInput(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSetNickname} className="space-y-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="例: りゅう"
                maxLength={30}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 placeholder:text-stone-400"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-full px-3 py-2 bg-ocean-600 text-white text-sm font-medium rounded-lg hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                設定する
              </button>
            </form>
            <p className="text-xs text-stone-400 mt-2">
              レビュー投稿時の表示名になります
            </p>
          </div>
        )}
      </div>
    );
  }

  // ログイン中
  const initials = nickname.slice(0, 1);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        title={nickname}
      >
        <div className="w-7 h-7 rounded-full bg-ocean-100 dark:bg-ocean-900 flex items-center justify-center">
          <span className="text-xs font-medium text-ocean-700 dark:text-ocean-300">
            {initials}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-700">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">
              {nickname}
            </p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              setShowInput(true);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            <User size={14} />
            名前を変更
          </button>
          <button
            onClick={handleLogout}
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
