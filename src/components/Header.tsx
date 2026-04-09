"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, MapPin, BriefcaseBusiness } from "lucide-react";
import { countries } from "@/lib/countries";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const phaseLabel: Record<number, string> = {
  1: "公開中",
  2: "近日公開",
  3: "準備中",
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const phases = [1, 2, 3] as const;

  return (
    <header className="sticky top-0 z-50 bg-sand-50/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-100 dark:border-stone-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="flex items-start gap-3">
          <div>
            <span className="heading-editorial text-2xl font-bold text-gradient tracking-tight">
              <span className="text-[1.35em]">K</span>aigaijin
            </span>
            <div className="hidden md:flex items-center gap-2 -mt-0.5">
              <div className="h-px w-4 bg-teal-500 opacity-60" />
              <span className="text-[10px] text-teal-600 dark:text-teal-400 tracking-widest uppercase font-medium">
                海外在住日本人のメディア
              </span>
            </div>
          </div>
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-400">
          {/* 国一覧ドロップダウン */}
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-warm-500 dark:hover:text-warm-400 transition-colors">
              国一覧
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute top-full left-1/2 -translate-x-1/2 pt-2">
              <div className="bg-sand-50 dark:bg-stone-900 rounded-xl shadow-xl shadow-stone-900/10 border border-stone-100 dark:border-stone-700 p-4 min-w-[400px]">
                {phases.map((phase) => {
                  const group = countries.filter((c) => c.phase === phase);
                  return (
                    <div key={phase} className="mb-3 last:mb-0">
                      <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5 px-2">
                        {phaseLabel[phase]}
                      </p>
                      <div className="grid grid-cols-1 gap-0.5">
                        {group.map((c) => (
                          <div key={c.code} className="flex items-center gap-1 rounded-lg hover:bg-warm-50 dark:hover:bg-stone-700/60 transition-colors px-2 py-1.5">
                            <Link
                              href={`/${c.code}`}
                              prefetch={false}
                              className="flex items-center gap-2.5 flex-1 min-w-0"
                            >
                              <span className="text-lg shrink-0">{c.flag}</span>
                              <span className="text-stone-700 dark:text-stone-300 text-sm hover:text-warm-700 dark:hover:text-warm-400 transition-colors truncate">
                                {c.name}
                              </span>
                              <span className="text-[11px] text-stone-400 dark:text-stone-500 ml-auto shrink-0">
                                {c.population}
                              </span>
                            </Link>
                            {/* 全フェーズでスポット・求人クイックリンク */}
                            {(
                              <div className="flex items-center gap-1 ml-2 shrink-0">
                                <Link
                                  href={`/${c.code}/place`}
                                  className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-warm-600 dark:hover:text-warm-400 bg-stone-100 dark:bg-stone-800 hover:bg-warm-50 dark:hover:bg-warm-900/30 px-2 py-1 rounded-md transition-colors"
                                  title="KAIプレイス"
                                >
                                  <MapPin size={10} />
                                  KAIプレイス
                                </Link>
                                <Link
                                  href={`/${c.code}/jobs`}
                                  className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-warm-600 dark:hover:text-warm-400 bg-stone-100 dark:bg-stone-800 hover:bg-warm-50 dark:hover:bg-warm-900/30 px-2 py-1 rounded-md transition-colors"
                                  title="KAIジョブ"
                                >
                                  <BriefcaseBusiness size={10} />
                                  KAIジョブ
                                </Link>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <Link
            href="/visa-simulator"
            className="hover:text-warm-500 dark:hover:text-warm-400 transition-colors"
          >
            ビザ診断
          </Link>
          <Link
            href="/contact"
            className="hover:text-warm-500 dark:hover:text-warm-400 transition-colors"
          >
            お問い合わせ
          </Link>
          <ThemeToggle />
          <UserMenu />
        </nav>

        {/* モバイル */}
        <div className="flex items-center gap-1 md:hidden">
          <UserMenu />
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 text-stone-600 dark:text-stone-400"
            aria-label="メニュー"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* モバイルドロワー */}
      {open && (
        <nav className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-sand-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 px-4 pb-4 overflow-y-auto z-40">
          <div className="flex flex-col gap-1 text-sm font-medium text-stone-600 dark:text-stone-400">
            {phases.map((phase) => {
              const group = countries.filter((c) => c.phase === phase);
              return (
                <div key={phase}>
                  <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-3 mb-1 px-1">
                    {phaseLabel[phase]}
                  </p>
                  {group.map((c) => (
                    <div key={c.code} className="border-b border-stone-100 dark:border-stone-800">
                      <Link
                        href={`/${c.code}`}
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 py-2 px-1"
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="flex-1">{c.name}</span>
                      </Link>
                      {(
                        <div className="flex gap-2 pb-2 px-1 ml-7">
                          <Link
                            href={`/${c.code}/place`}
                            prefetch={false}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-1 text-xs text-stone-400 hover:text-warm-600 dark:hover:text-warm-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <MapPin size={10} />
                            KAIプレイス
                          </Link>
                          <Link
                            href={`/${c.code}/jobs`}
                            prefetch={false}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-1 text-xs text-stone-400 hover:text-warm-600 dark:hover:text-warm-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <BriefcaseBusiness size={10} />
                            KAIジョブ
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            <Link
              href="/visa-simulator"
              onClick={() => setOpen(false)}
              className="py-2 mt-2 text-warm-600 dark:text-warm-400 font-semibold"
            >
              ビザ診断
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="py-2 text-stone-600 dark:text-stone-400 font-semibold"
            >
              お問い合わせ
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
