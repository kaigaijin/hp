import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConfessionsClient from "./ConfessionsClient";

export const metadata: Metadata = {
  title: "海外在住日本人の本音 | Kaigaijin Confessions",
  description:
    "差別・パートナー・お金・仕事——海外で暮らす日本人のリアルな本音を匿名で投稿・共有するコンテンツ。",
  alternates: { canonical: "https://kaigaijin.jp/confessions" },
  openGraph: {
    title: "海外在住日本人の本音 | Kaigaijin Confessions",
    description: "差別・パートナー・お金・仕事——海外で暮らす日本人のリアルな本音を匿名で投稿・共有。",
    type: "website",
    locale: "ja_JP",
    url: "https://kaigaijin.jp/confessions",
    siteName: "Kaigaijin",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function ConfessionsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          {/* ヘッダー */}
          <div className="mb-10">
            <p className="text-xs font-medium tracking-widest text-warm-600 dark:text-warm-400 uppercase mb-3">
              Confessions
            </p>
            <h1 className="heading-editorial text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4">
              海外在住日本人の本音
            </h1>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
              差別、パートナー、お金、仕事——普段は言えないことを匿名で。<br />
              ログインするとニックネームで投稿できます。
            </p>
            {/* データ利用に関する説明 */}
            <div className="bg-stone-100 dark:bg-stone-800 rounded-xl px-5 py-4 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              ご投稿いただいたデータは、サービス開発・改善および調査レポートの作成に活用させていただきます。個人が特定される情報は公開しません。
            </div>
          </div>

          <ConfessionsClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
