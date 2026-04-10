import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getReturnArticles } from "@/lib/articles";
import { Calendar, ArrowRight, Plane } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "帰国準備ガイド | Kaigaijin",
  description:
    "海外から日本に本帰国・一時帰国するときに必要な手続き・キャリア・銀行・年金・保険・住まいの情報をまとめた帰国者向けガイド。",
  openGraph: {
    title: "帰国準備ガイド | Kaigaijin",
    description:
      "海外から日本に本帰国・一時帰国するときに必要な手続き・キャリア・銀行・年金・保険・住まいの情報をまとめた帰国者向けガイド。",
    type: "website",
    locale: "ja_JP",
  },
  alternates: {
    canonical: "https://kaigaijin.jp/return",
  },
};

const CATEGORY_ORDER = [
  "帰国準備",
  "銀行・お金",
  "税金・お金",
  "保険・医療",
  "住居・帰国準備",
  "キャリア・転職",
  "手続き・届出",
  "メンタル・再適応",
];

export default function ReturnPage() {
  const articles = getReturnArticles();

  // カテゴリ別にグループ化
  const byCategory: Record<string, typeof articles> = {};
  for (const a of articles) {
    const cat = a.category || "その他";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a);
  }

  // カテゴリを定義順でソート
  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory[c]),
    ...Object.keys(byCategory).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <>
      <Header />
      <main>
        {/* ヒーロー */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-warm-500/20 rounded-full p-4">
                <Plane size={32} className="text-warm-400 rotate-[135deg]" />
              </div>
            </div>
            <h1 className="heading-editorial text-4xl md:text-5xl font-bold mb-4 leading-tight">
              帰国準備ガイド
            </h1>
            <p className="text-lg text-stone-300 leading-relaxed max-w-2xl mx-auto">
              本帰国・一時帰国に必要な手続き・お金・キャリアの情報をまとめました。
              「何から手をつければいいか」から「帰国後の再適応」まで。
            </p>
          </div>
        </section>

        {/* 記事一覧 */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          {sortedCategories.length === 0 && (
            <p className="text-stone-400 text-center py-20">記事を準備中です。</p>
          )}
          {sortedCategories.map((cat) => (
            <div key={cat} className="mb-12">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4 pb-2 border-b border-stone-200 dark:border-stone-700">
                {cat}
              </h2>
              <div className="grid gap-4">
                {byCategory[cat].map((article) => (
                  <Link
                    key={article.slug}
                    href={`/return/${article.slug}`}
                    className="group flex items-start justify-between gap-4 p-5 rounded-xl border border-stone-100 dark:border-stone-800 hover:border-warm-200 dark:hover:border-warm-800 hover:bg-warm-50/50 dark:hover:bg-warm-900/10 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100 group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors leading-snug mb-1.5">
                        {article.title}
                      </h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-stone-400">
                        <Calendar size={11} />
                        {article.date}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="shrink-0 mt-1 text-stone-300 group-hover:text-warm-500 transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
