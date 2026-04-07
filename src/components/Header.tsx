"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
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

  // 現在のURLから国コードを取得（/sg/... → "sg"）、なければ "sg" をデフォルト
  const currentCountryCode = (() => {
    const seg = pathname.split("/")[1];
    return countries.some((c) => c.code === seg) ? seg : "sg";
  })();
  const spotHref = `/${currentCountryCode}/spot`;

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
              <div className="bg-sand-50 dark:bg-stone-900 rounded-xl shadow-xl shadow-stone-900/10 border border-stone-100 dark:border-stone-700 p-4 min-w-[320px]">
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
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-warm-50 dark:hover:bg-stone-700/60 transition-colors"
                          >
                            <span className="text-lg">{c.flag}</span>
                            <span className="text-stone-700 dark:text-stone-300 text-sm hover:text-warm-700 dark:hover:text-warm-400 transition-colors">
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
            className="hover:text-warm-500 dark:hover:text-warm-400 transition-colors"
          >
            お問い合わせ
          </Link>
          <Link
            href={spotHref}
            className="bg-warm-50 dark:bg-warm-900/20 text-warm-700 dark:text-warm-400 px-3 py-1 rounded-full border border-warm-200 dark:border-warm-800 hover:bg-warm-100 dark:hover:bg-warm-900/40 transition-colors text-xs font-semibold tracking-wide"
          >
            KAIスポット
          </Link>
          <Link
            href={`/${currentCountryCode}/jobs`}
            className="bg-warm-50 dark:bg-warm-900/20 text-warm-700 dark:text-warm-400 px-3 py-1 rounded-full border border-warm-200 dark:border-warm-800 hover:bg-warm-100 dark:hover:bg-warm-900/40 transition-colors text-xs font-semibold tracking-wide"
          >
            KAIジョブ
          </Link>
          <ThemeToggle />
          <UserMenu />
        </nav>

        {/* モバイル */}
        <div className="flex items-center gap-2 md:hidden">
          <UserMenu />
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
        <nav className="md:hidden bg-sand-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800 px-4 pb-4">
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
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="py-2 mt-2 text-warm-600 dark:text-warm-400 font-semibold"
            >
              お問い合わせ
            </Link>
            <Link
              href={spotHref}
              onClick={() => setOpen(false)}
              className="py-2 text-warm-600 dark:text-warm-400 font-semibold"
            >
              KAIスポット
            </Link>
            <Link
              href={`/${currentCountryCode}/jobs`}
              onClick={() => setOpen(false)}
              className="py-2 text-warm-600 dark:text-warm-400 font-semibold"
            >
              KAIジョブ
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
