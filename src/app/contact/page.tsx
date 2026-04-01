import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "Kaigaijinへのお問い合わせはこちらから。広告掲載、記事に関するご意見、取材依頼など、お気軽にご連絡ください。",
  openGraph: {
    title: "お問い合わせ | Kaigaijin",
    description:
      "Kaigaijinへのお問い合わせはこちらから。お気軽にご連絡ください。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        {/* ===== ヒーロー ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-warm-900 via-warm-800 to-warm-700 text-white">
          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
            <div className="max-w-2xl">
              <p className="text-warm-300 text-sm font-medium tracking-widest uppercase mb-4">
                Contact
              </p>
              <h1 className="heading-editorial text-4xl md:text-5xl font-bold leading-tight mb-6">
                お問い合わせ
              </h1>
              <p className="text-lg text-warm-200 leading-relaxed max-w-lg">
                広告掲載、記事に関するご意見・ご感想、取材依頼など、
                <br />
                お気軽にお問い合わせください。
              </p>
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

        {/* ===== フォーム ===== */}
        <section className="py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-4">
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
