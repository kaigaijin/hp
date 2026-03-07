"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { countries } from "@/lib/countries";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [open, setOpen] = useState(false);

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
          {countries
            .filter((c) => c.phase === 1)
            .map((c) => (
              <Link
                key={c.code}
                href={`/${c.code}`}
                className="hover:text-ocean-700 dark:hover:text-ocean-400 transition-colors"
              >
                {c.flag} {c.name}
              </Link>
            ))}
          <span className="text-stone-300 dark:text-stone-600">|</span>
          <Link
            href="#countries"
            className="hover:text-ocean-700 dark:hover:text-ocean-400 transition-colors"
          >
            国一覧
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
          <div className="flex flex-col gap-3 text-sm font-medium text-stone-600 dark:text-stone-400">
            {countries.map((c) => (
              <Link
                key={c.code}
                href={`/${c.code}`}
                onClick={() => setOpen(false)}
                className="py-2 border-b border-stone-100 dark:border-stone-800 last:border-0"
              >
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
