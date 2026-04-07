import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import JobSubmitForm from "@/components/JobSubmitForm";
import {
  ChevronRight,
  CheckCircle,
  Zap,
  ShieldCheck,
  Users,
} from "lucide-react";

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) return {};

  return {
    title: `求人情報を掲載する（無料）— ${country.name}`,
    description: `${country.name}の日本人・日本語対応の求人情報を無料で掲載できます。飲食・IT・教育・美容など業種を問わず掲載可能です。`,
    openGraph: {
      title: `求人情報を掲載する（無料）| Kaigaijin`,
      description: `${country.name}の日本人・日本語対応の求人情報を無料で掲載できます。`,
      type: "website",
      locale: "ja_JP",
      url: `https://kaigaijin.jp/${code}/jobs/new`,
      siteName: "Kaigaijin",
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function JobNewPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  return (
    <>
      <Header />
      <main className="bg-stone-50 dark:bg-stone-900 min-h-screen">

        {/* ─── ヒーローヘッダー ────────────────────── */}
        <div className="bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e]">
          <div className="max-w-4xl mx-auto px-4 pt-4 pb-12">
            {/* パンくず */}
            <nav className="flex items-center gap-1.5 text-xs text-stone-400/80 mb-8 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}`} className="hover:text-white transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/jobs`} className="hover:text-white transition-colors">
                求人情報
              </Link>
              <ChevronRight size={12} />
              <span className="text-white/90">求人を掲載する</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <p className="text-stone-400 text-sm font-semibold mb-3">
                  {country.flag} {country.name} / 採用担当者向け
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                  求人情報を無料掲載
                </h1>
                <p className="text-stone-300 text-sm leading-relaxed max-w-md">
                  {country.name}で日本人・日本語対応スタッフを募集している企業・個人事業主の方。
                  フォームから3ステップで投稿できます。
                </p>
              </div>

              {/* メリットカード */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 space-y-3 min-w-[220px]">
                {[
                  { icon: CheckCircle, text: "掲載料 完全無料" },
                  { icon: Zap, text: "3ステップで投稿完了" },
                  { icon: ShieldCheck, text: "審査後に掲載・安心" },
                  { icon: Users, text: "日本人求職者に直接リーチ" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-warm-400" />
                    </div>
                    <p className="text-white text-sm font-medium">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── フォームエリア ───────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 py-10 pb-16">
          {/* 掲載基準ノート */}
          <div className="bg-warm-50 dark:bg-stone-800 border border-warm-100 dark:border-stone-700 rounded-2xl p-5 mb-8">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
              掲載基準について
            </p>
            <ul className="space-y-1.5">
              {[
                "日本人向け・日本語対応の求人を掲載しています",
                "掲載料は無料。審査後にメールでご連絡します",
                "虚偽・詐欺的な内容は掲載をお断りしています",
                "掲載中の変更・削除はお問い合わせください",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300"
                >
                  <CheckCircle size={13} className="shrink-0 mt-0.5 text-warm-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 3ステップウィザードフォーム */}
          <JobSubmitForm country={code} />
        </div>
      </main>
      <Footer />
    </>
  );
}
