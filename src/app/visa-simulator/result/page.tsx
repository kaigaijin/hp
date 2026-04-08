import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VisaResult from "./VisaResult";

export const metadata: Metadata = {
  title: "ビザ診断結果",
  description: "あなたの条件に合った海外移住・長期滞在ビザの診断結果です。",
  openGraph: {
    title: "海外移住ビザ診断結果 | Kaigaijin",
    description: "あなたの条件に合った海外移住・長期滞在ビザの診断結果です。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function VisaResultPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#0e2a1a] text-white">
          <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24">
            <p className="section-label mb-4 text-teal-400">— Visa Simulator 診断結果</p>
            <h1 className="heading-editorial text-3xl md:text-4xl font-bold leading-tight">
              あなたが住める国・ビザ
            </h1>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 40C360 80 720 0 1080 40C1260 60 1380 60 1440 40V80H0V40Z" className="fill-stone-50 dark:fill-stone-900" />
            </svg>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-stone-50 dark:bg-stone-900">
          <div className="max-w-4xl mx-auto px-4">
            <Suspense fallback={<div className="text-stone-500 text-center py-20">読み込み中...</div>}>
              <VisaResult />
            </Suspense>
          </div>
        </section>

        <section className="py-12 bg-white dark:bg-stone-950">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl p-6">
              <h2 className="font-bold text-stone-700 dark:text-stone-300 mb-3">ご利用にあたって</h2>
              <ul className="text-sm text-stone-500 dark:text-stone-400 space-y-1.5 list-disc list-inside">
                <li>本ツールは日本国籍パスポート保持者を前提としています。</li>
                <li>ビザ条件は各国の法改正・外交状況により変更される場合があります。最新情報は必ず各国大使館・公式サイトでご確認ください。</li>
                <li>本ツールの結果はビザ取得を保証するものではありません。実際の申請には専門家（行政書士・移住コンサルタント等）への相談をお勧めします。</li>
                <li>2026年4月時点の情報を基に作成しています。</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
