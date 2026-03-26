"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { countries } from "@/lib/countries";
import ThemeToggle from "./ThemeToggle";

const phaseLabel: Record<number, string> = {
  1: "公開中",
  2: "近日公開",
  3: "準備中",
};

export default function Header() {
  const [open, setOpen] = useState(false);

  const phases = [1, 2, 3] as const;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-700">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2">
          <span className="heading-editorial text-xl font-bold text-gradient">
            Kaigaijin
          </span>
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-400">
          {/* 国一覧ドロップダウン */}
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-ocean-700 dark:hover:text-ocean-400 transition-colors">
              国一覧
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute top-full left-1/2 -translate-x-1/2 pt-2">
              <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 p-4 min-w-[320px]">
                {phases.map((phase) => {
                  const group = countries.filter((c) => c.phase === phase);
                  return (
                    <div key={phase} className="mb-3 last:mb-0">
                      <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5 px-2">
                        {phaseLabel[phase]}
                      </p>
                      <div className="grid grid-cols-1 gap-0.5">
                        {group.map((c) => (
                          <Link
                            key={c.code}
                            href={`/${c.code}`}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-ocean-50 dark:hover:bg-stone-700 transition-colors"
                          >
                            <span className="text-base">{c.flag}</span>
                            <span className="text-stone-700 dark:text-stone-300 text-sm">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-stone-400 dark:text-stone-500 ml-auto">
                              {c.population}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <Link
            href="/contact"
            className="hover:text-ocean-700 dark:hover:text-ocean-400 transition-colors"
          >
            お問い合わせ
          </Link>
          <ThemeToggle />
        </nav>

        {/* モバイル */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-stone-600 dark:text-stone-400"
            aria-label="メニュー"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* モバイルドロワー */}
      {open && (
        <nav className="md:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 px-4 pb-4">
          <div className="flex flex-col gap-1 text-sm font-medium text-stone-600 dark:text-stone-400">
            {phases.map((phase) => {
              const group = countries.filter((c) => c.phase === phase);
              return (
                <div key={phase}>
                  <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-3 mb-1 px-1">
                    {phaseLabel[phase]}
                  </p>
                  {group.map((c) => (
                    <Link
                      key={c.code}
                      href={`/${c.code}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 py-2 px-1 border-b border-stone-100 dark:border-stone-800"
                    >
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="py-2 mt-2 text-ocean-600 dark:text-ocean-400 font-semibold"
            >
              お問い合わせ
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
