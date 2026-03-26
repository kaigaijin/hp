import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import Link from "next/link";
import {
  Users,
  Target,
  BarChart3,
  Megaphone,
  FileText,
  Mail,
  Globe,
  TrendingUp,
  Building2,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "広告掲載について",
  description:
    "Kaigaijinへの広告掲載についてご案内します。海外在住日本人にピンポイントでリーチできる、国内唯一の国別特化メディアです。",
  openGraph: {
    title: "広告掲載について | Kaigaijin",
    description:
      "海外在住日本人にピンポイントでリーチ。国別特化メディアへの広告掲載をご検討ください。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const AD_PLANS = [
  {
    name: "プレミアムバナー",
    position: "記事上部（全記事共通）",
    price: "¥50,000〜",
    period: "月額",
    features: ["全記事ページの最上部に表示", "最大インプレッション", "PC・スマホ両対応"],
  },
  {
    name: "国別スポンサー",
    position: "特定国の全記事",
    price: "¥30,000〜",
    period: "月額",
    features: [
      "指定国の記事にのみ表示",
      "ターゲット国の在住者に集中リーチ",
      "スポンサーラベル付き",
    ],
  },
  {
    name: "タイアップ記事",
    position: "コラム記事として掲載",
    price: "¥50,000〜",
    period: "1記事",
    features: [
      "編集部が記事を制作",
      "SEO効果で長期的に集客",
      "SNSでの拡散あり",
    ],
  },
];

const STRENGTHS = [
  {
    icon: Target,
    title: "ピンポイントリーチ",
    desc: "「シンガポール在住日本人」「タイ在住日本人」など、国×日本人で絞り込んだ読者に届きます。このセグメントに日本語でリーチできるメディアは他にほとんどありません。",
  },
  {
    icon: Users,
    title: "高い読者属性",
    desc: "読者の多くは駐在員・現地採用・経営者など、可処分所得の高い層です。金融・不動産・教育・医療サービスとの相性が抜群です。",
  },
  {
    icon: TrendingUp,
    title: "成長する市場",
    desc: "海外在住日本人は約129万人、年3〜5%で増加中。市場の成長とともに、メディアのリーチも拡大し続けます。",
  },
];

const TARGET_INDUSTRIES = [
  { icon: Building2, name: "不動産", example: "日系不動産エージェント、賃貸仲介" },
  { icon: Users, name: "医療・クリニック", example: "日本語対応クリニック、歯科、健康診断" },
  { icon: FileText, name: "士業・コンサル", example: "会計事務所、法律事務所、税務コンサル" },
  { icon: Globe, name: "人材・教育", example: "人材紹介、日本語学習塾、インターナショナルスクール" },
  { icon: BarChart3, name: "金融・保険", example: "現地保険、海外送金、証券・投資サービス" },
  { icon: Megaphone, name: "その他サービス", example: "引越し、旅行、飲食、ECなど" },
];

export default function AdvertisePage() {
  return (
    <>
      <Header />
      <main>
        {/* ===== ヒーロー ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-16 text-8xl">📢</div>
            <div className="absolute bottom-24 left-12 text-6xl">🌏</div>
          </div>

          <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36">
            <div className="max-w-2xl">
              <p className="text-ocean-300 text-sm font-medium tracking-widest uppercase mb-4">
                Advertising
              </p>
              <h1 className="heading-editorial text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                海外在住日本人に、
                <br />
                <span className="text-ocean-300">ピンポイント</span>で届く。
              </h1>
              <p className="text-lg text-ocean-200 leading-relaxed mb-10 max-w-lg">
                Kaigaijinは、国別に深い生活情報を届ける日本語メディアです。
                <br />
                御社のサービスを、まさにそれを必要としている読者に届けます。
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-ocean-800 font-semibold px-8 py-4 rounded-full hover:bg-ocean-50 transition-colors"
              >
                <Mail size={18} />
                お問い合わせはこちら
              </Link>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 40C360 80 720 0 1080 40C1260 60 1380 60 1440 40V80H0V40Z"
                className="fill-stone-50 dark:fill-stone-900"
              />
            </svg>
          </div>
        </section>

        {/* ===== Kaigaijinの強み ===== */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="heading-editorial text-3xl md:text-4xl font-bold mb-6 line-accent mx-auto w-fit">
                なぜKaigaijinなのか
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed mt-8">
                海外在住日本人は約129万人。国ごとの生活情報を日本語で深く発信するメディアはKaigaijinだけです。
                <br />
                御社のサービスを、まさにそれを必要としている読者に届けます。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STRENGTHS.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8"
                >
                  <div className="w-12 h-12 bg-ocean-50 dark:bg-ocean-900/30 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="text-ocean-600 dark:text-ocean-400" size={24} />
                  </div>
                  <h3 className="heading-editorial text-lg font-bold mb-3">{title}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 読者データ ===== */}
        <section className="py-20 md:py-28 bg-sand-50 dark:bg-stone-800/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="heading-editorial text-3xl md:text-4xl font-bold text-center mb-16">
              読者プロフィール
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "129万人", label: "海外在住日本人", icon: Globe },
                { number: "年3〜5%", label: "市場成長率", icon: TrendingUp },
                { number: "高所得層", label: "駐在員・経営者中心", icon: Users },
                { number: "6カ国+", label: "カバーエリア", icon: Target },
              ].map(({ number, label, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon className="mx-auto text-ocean-400 mb-3" size={28} />
                  <p className="heading-editorial text-2xl md:text-3xl font-bold text-ocean-800 dark:text-ocean-300">
                    {number}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 広告プラン ===== */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="heading-editorial text-3xl md:text-4xl font-bold mb-6 line-accent mx-auto w-fit">
                広告プラン
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed mt-8">
                メディアの成長段階に合わせて、柔軟な料金をご案内しています。
                <br />
                まずはお気軽にご相談ください。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {AD_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 flex flex-col"
                >
                  <h3 className="heading-editorial text-xl font-bold mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                    {plan.position}
                  </p>
                  <div className="mb-6">
                    <span className="heading-editorial text-3xl font-bold text-ocean-700 dark:text-ocean-300">
                      {plan.price}
                    </span>
                    <span className="text-sm text-stone-400 ml-1">
                      （税込）/ {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300"
                      >
                        <span className="text-ocean-500 mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 相性の良い業種 ===== */}
        <section className="py-20 md:py-28 bg-sand-50 dark:bg-stone-800/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="heading-editorial text-3xl md:text-4xl font-bold mb-6 line-accent mx-auto w-fit">
                こんな業種に選ばれています
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TARGET_INDUSTRIES.map(({ icon: Icon, name, example }) => (
                <div
                  key={name}
                  className="flex items-start gap-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6"
                >
                  <div className="w-10 h-10 bg-ocean-50 dark:bg-ocean-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="text-ocean-600 dark:text-ocean-400" size={20} />
                  </div>
                  <div>
                    <p className="font-bold mb-1">{name}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {example}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== お問い合わせ ===== */}
        <section id="contact" className="py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="heading-editorial text-3xl md:text-4xl font-bold mb-6 line-accent mx-auto w-fit">
                お問い合わせ
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed mt-8">
                広告掲載に関するご質問・ご相談はお気軽にどうぞ。
                <br />
                通常2営業日以内にご返信いたします。
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
