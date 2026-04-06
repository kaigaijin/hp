import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import JobSubmitForm from "@/components/JobSubmitForm";
import { ChevronRight, BriefcaseBusiness, FileText } from "lucide-react";

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
      // フォームページはnoindexにしてOK（薄いコンテンツ防止）
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
      <main className="bg-sand-50 dark:bg-stone-900 min-h-screen">
        {/* ヒーローヘッダー */}
        <div className="bg-white dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* パンくず */}
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-4 flex-wrap">
              <Link href="/" className="hover:text-warm-600 transition-colors">
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}`}
                className="hover:text-warm-600 transition-colors"
              >
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}/jobs`}
                className="hover:text-warm-600 transition-colors"
              >
                求人情報
              </Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">求人を掲載する</span>
            </nav>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                <BriefcaseBusiness size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="heading-editorial text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
                  {country.flag} {country.name}の求人を掲載する
                </h1>
                <p className="text-sm text-stone-400 dark:text-stone-500 mt-0.5">無料・審査あり</p>
              </div>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
              {country.name}で日本人・日本語対応のスタッフを募集している企業・個人事業主の方は、
              フォームから無料でご投稿ください。内容を確認後、順次掲載いたします。
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* 掲載基準の説明 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  掲載基準について
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>日本人向け・日本語対応の求人を掲載しています</li>
                  <li>掲載料は無料です。審査後に掲載可否をご連絡します</li>
                  <li>虚偽・詐欺的な内容は掲載をお断りしています</li>
                  <li>掲載中の内容変更・削除はお問い合わせください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* フォーム */}
          <JobSubmitForm country={code} />
        </div>
      </main>
      <Footer />
    </>
  );
}
