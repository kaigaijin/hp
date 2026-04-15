import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AskClient from "./AskClient";

export const metadata: Metadata = {
  title: "匿名質問箱 | Kaigaijin",
  description:
    "海外在住日本人への質問を匿名で投稿・回答できる質問箱。移住・仕事・パートナー・お金——聞きにくいことをここで。",
  alternates: { canonical: "https://kaigaijin.jp/ask" },
  openGraph: {
    title: "匿名質問箱 | Kaigaijin",
    description: "海外在住日本人への質問を匿名で投稿・回答できる質問箱。",
    type: "website",
    locale: "ja_JP",
    url: "https://kaigaijin.jp/ask",
    siteName: "Kaigaijin",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function AskPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <div className="mb-10">
            <p className="text-xs font-medium tracking-widest text-warm-600 dark:text-warm-400 uppercase mb-3">
              Anonymous Q&A
            </p>
            <h1 className="heading-editorial text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4">
              匿名質問箱
            </h1>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
              海外在住日本人に聞いてみたいことを匿名で投稿できます。<br />
              運営からの質問にも、ぜひ答えてみてください。
            </p>
            <div className="bg-stone-100 dark:bg-stone-800 rounded-xl px-5 py-4 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              投稿いただいた内容はサービス改善・調査レポートに活用します。個人が特定される情報は公開しません。
            </div>
          </div>
          <AskClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
