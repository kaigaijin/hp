import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { countries } from "@/lib/countries";
import { getCategoryCounts } from "@/lib/directory";
import Link from "next/link";
import {
  EnCaption,
  NumberLabel,
  Hairline,
  DoubleRule,
  DottedRule,
  KaiMono,
  KaiBtn,
} from "@/components/kai";

export const metadata: Metadata = {
  title: "Kaigaijin | 海外在住日本人のための国別生活ガイド",
  description:
    "シンガポール、タイ、UAE、マレーシア…国別に深い生活情報を届ける、海外在住日本人のためのメディア。ビザ・保険・住居・税金・医療、現地で本当に必要な情報を。",
  alternates: { canonical: "https://kaigaijin.jp" },
  openGraph: {
    title: "Kaigaijin | 海外在住日本人のための国別生活ガイド",
    description: "国別に深い生活情報を届ける、海外在住日本人のためのメディア。",
    type: "website",
    locale: "ja_JP",
    url: "https://kaigaijin.jp",
    siteName: "Kaigaijin",
  },
  twitter: { card: "summary_large_image" },
};

export default async function Home() {
  const placeCounts: Record<string, number> = {};
  for (const c of countries) {
    const counts = await getCategoryCounts(c.code);
    placeCounts[c.code] = Object.values(counts).reduce((a, b) => a + b, 0);
  }

  return (
    <>
      <Header />
      <main style={{ background: "var(--color-bg)" }}>

        {/* ===== HERO — 新聞・誌面風 ===== */}
        <section
          style={{
            background: "var(--color-bg-soft)",
            padding: "64px 40px 80px",
            borderBottom: "2px solid var(--color-sumi-900)",
          }}
          className="px-4 md:px-10"
        >
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>

            {/* Masthead */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 14,
                borderBottom: "1px solid var(--color-sumi-900)",
                marginBottom: 48,
              }}
              className="flex-col md:flex-row gap-2 md:gap-0"
            >
              <EnCaption>Overseas · Japanese · Media</EnCaption>
              <KaiMono style={{ color: "var(--color-sumi-500)" }}>
                第 壱 号 · 令和八年 四月
              </KaiMono>
              <EnCaption>Issue 01 · Vol. 1</EnCaption>
            </div>

            {/* 2カラム Hero */}
            <div
              style={{ display: "grid", gap: 80, alignItems: "center" }}
              className="grid-cols-1 lg:grid-cols-[1.3fr_1fr]"
            >
              {/* 左: コピー + CTA */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 1,
                      background: "var(--color-shu-500)",
                    }}
                  />
                  <EnCaption color="var(--color-shu-500)">Feature Story</EnCaption>
                </div>

                <h1
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(52px, 7vw, 84px)",
                    fontWeight: 600,
                    lineHeight: 1.1,
                    letterSpacing: "0.02em",
                    margin: "0 0 28px",
                    color: "var(--color-fg)",
                  }}
                >
                  その国で、
                  <br />
                  <span style={{ color: "var(--color-shu-500)" }}>深く</span>暮らす。
                </h1>

                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 15.5,
                    lineHeight: 2,
                    color: "var(--color-sumi-500)",
                    margin: "0 0 36px",
                    maxWidth: 480,
                  }}
                >
                  ビザ、税金、保険、住居、医療——国ごとに異なる「暮らしの実務」を、在住者の視点で丁寧に解説します。
                </p>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <KaiBtn kind="primary" size="lg" href="/visa-simulator" icon="→">
                    住める国を診断する
                  </KaiBtn>
                  <KaiBtn kind="ghost" size="lg" href="#countries">
                    国別ガイド
                  </KaiBtn>
                </div>
              </div>

              {/* 右: 国グリッドパネル */}
              <div
                className="hidden lg:block"
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-sumi-900)",
                  padding: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 18,
                  }}
                >
                  <EnCaption>Countries Covered</EnCaption>
                  <KaiMono style={{ color: "var(--color-sumi-500)" }}>
                    {countries.length} カ国
                  </KaiMono>
                </div>
                <DottedRule style={{ marginBottom: 16 }} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                    background: "var(--color-border)",
                  }}
                >
                  {countries.slice(0, 8).map((c) => (
                    <Link
                      key={c.code}
                      href={`/${c.code}`}
                      style={{
                        background: "var(--color-bg)",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textDecoration: "none",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{c.flag}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--color-fg)",
                          }}
                        >
                          {c.name}
                        </div>
                        <KaiMono style={{ color: "var(--color-sumi-400)", fontSize: "0.625rem" }}>
                          {c.population}
                        </KaiMono>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 特徴 3-up ===== */}
        <section
          style={{ padding: "80px 40px", borderBottom: "1px solid var(--color-border)" }}
          className="px-4 md:px-10"
        >
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div
              style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 48 }}
            >
              <NumberLabel n={1} />
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(24px, 3vw, 36px)",
                  fontWeight: 600,
                  margin: 0,
                  letterSpacing: "0.02em",
                  color: "var(--color-fg)",
                }}
              >
                国別に深い、
                <span style={{ color: "var(--color-shu-500)" }}>だから役に立つ。</span>
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                borderTop: "1px solid var(--color-sumi-900)",
                borderBottom: "1px solid var(--color-sumi-900)",
              }}
              className="grid-cols-1 md:grid-cols-3"
            >
              {[
                {
                  no: "01",
                  t: "国別に特化",
                  d: "シンガポール、タイ、UAE……それぞれの国に特化した深い情報。広く浅いメディアとは一線を画します。",
                },
                {
                  no: "02",
                  t: "実務に直結",
                  d: "ビザの取り方、確定申告の仕方、保険の選び方。生活に直結する実務情報を分かりやすく。",
                },
                {
                  no: "03",
                  t: "在住者視点",
                  d: "観光ガイドではなく、実際にその国で暮らす人のための情報。現地の空気感が伝わるコンテンツを。",
                },
              ].map((f, i) => (
                <div
                  key={f.no}
                  style={{
                    padding: "36px 32px",
                    borderLeft: i > 0 ? "1px solid var(--color-border)" : "none",
                  }}
                  className={i > 0 ? "border-t md:border-t-0" : ""}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-serif-en)",
                      fontSize: 52,
                      fontWeight: 300,
                      fontStyle: "italic",
                      color: "var(--color-shu-500)",
                      lineHeight: 1,
                      marginBottom: 20,
                    }}
                  >
                    {f.no}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 22,
                      fontWeight: 600,
                      margin: "0 0 14px",
                      color: "var(--color-fg)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {f.t}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 13.5,
                      lineHeight: 1.9,
                      color: "var(--color-sumi-500)",
                      margin: 0,
                    }}
                  >
                    {f.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 国一覧 ===== */}
        <section
          id="countries"
          style={{ padding: "80px 40px", borderBottom: "1px solid var(--color-border)" }}
          className="px-4 md:px-10"
        >
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 40,
                gap: 20,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                    marginBottom: 8,
                  }}
                >
                  <NumberLabel n={2} />
                  <h2
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(24px, 3vw, 36px)",
                      fontWeight: 600,
                      margin: 0,
                      letterSpacing: "0.02em",
                      color: "var(--color-fg)",
                    }}
                  >
                    国ごとに、別の暮らしがある。
                  </h2>
                </div>
              </div>
              <KaiMono style={{ color: "var(--color-sumi-400)", whiteSpace: "nowrap" }}>
                {countries.length} countries
              </KaiMono>
            </div>

            <div
              style={{ display: "grid", gap: 1, background: "var(--color-border)", border: "1px solid var(--color-border)" }}
              className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              {countries.map((c) => (
                <Link
                  key={c.code}
                  href={`/${c.code}`}
                  className="kai-card-a"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    background: "var(--color-bg)",
                    border: "1px solid transparent",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 16,
                          fontWeight: 600,
                          color: "var(--color-fg)",
                        }}
                      >
                        {c.name}
                      </span>
                      <EnCaption style={{ fontSize: "0.59375rem" }}>{c.nameEn}</EnCaption>
                    </div>
                    <KaiMono style={{ color: "var(--color-sumi-400)", fontSize: "0.6875rem" }}>
                      {c.population} 在住
                    </KaiMono>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-serif-en)",
                      fontSize: 11,
                      color: "var(--color-shu-500)",
                      fontStyle: "italic",
                      flexShrink: 0,
                    }}
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== IN NUMBERS ===== */}
        <section
          style={{
            padding: "80px 40px",
            background: "var(--color-sumi-900)",
            color: "var(--color-kinari-50)",
          }}
          className="px-4 md:px-10"
        >
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div
              style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 48 }}
            >
              <NumberLabel n={3} color="var(--color-shu-300)" />
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(24px, 3vw, 36px)",
                  fontWeight: 600,
                  margin: 0,
                  color: "var(--color-kinari-50)",
                  letterSpacing: "0.02em",
                }}
              >
                数字で読む、海外在住日本人
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                borderTop: "1px solid rgba(255,255,255,0.15)",
                borderBottom: "1px solid rgba(255,255,255,0.15)",
              }}
              className="grid-cols-2 md:grid-cols-4"
            >
              {[
                { num: "129", unit: "万人", label: "海外在住日本人" },
                { num: "34.8", unit: "万人", label: "アジア在住" },
                { num: "3–5", unit: "%", label: "年間増加率" },
                { num: `${countries.length}+`, unit: "カ国", label: "カバー中" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    padding: "40px 24px",
                    borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none",
                  }}
                  className={i > 0 ? "border-t md:border-t-0" : ""}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "clamp(40px, 5vw, 64px)",
                        fontWeight: 600,
                        color: "var(--color-shu-300)",
                        lineHeight: 1,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {s.num}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 20,
                        color: "var(--color-kinari-200)",
                      }}
                    >
                      {s.unit}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12.5,
                      color: "var(--color-kinari-200)",
                      opacity: 0.7,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ビザ診断CTA ===== */}
        <section
          style={{
            padding: "80px 40px",
            background: "var(--color-bg-soft)",
            borderTop: "1px solid var(--color-border)",
          }}
          className="px-4 md:px-10"
        >
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div
              style={{ display: "grid", gap: 60, alignItems: "center" }}
              className="grid-cols-1 lg:grid-cols-2"
            >
              <div>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}
                >
                  <NumberLabel n={4} />
                  <EnCaption color="var(--color-shu-500)">Visa Simulator · 診断</EnCaption>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(28px, 4vw, 48px)",
                    fontWeight: 600,
                    margin: "0 0 16px",
                    letterSpacing: "0.02em",
                    lineHeight: 1.15,
                    color: "var(--color-fg)",
                  }}
                >
                  あなたが住める国を、
                  <br />
                  <span style={{ color: "var(--color-shu-500)" }}>診断する。</span>
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    color: "var(--color-sumi-500)",
                    margin: "0 0 32px",
                    maxWidth: 480,
                    lineHeight: 1.9,
                  }}
                >
                  年齢・年収・資産・職業を入力するだけ——長期滞在・移住に使えるビザを逆引きで教えます。
                </p>
                <KaiBtn kind="primary" size="lg" href="/visa-simulator" icon="→">
                  今すぐ診断する
                </KaiBtn>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  background: "var(--color-border)",
                  border: "1px solid var(--color-sumi-900)",
                }}
              >
                {[
                  { country: "🇸🇬 シンガポール", visa: "EP · EntrePass · ONE Pass" },
                  { country: "🇹🇭 タイ", visa: "LTRビザ · 退職者ビザ" },
                  { country: "🇲🇾 マレーシア", visa: "MM2H · DE Rantau" },
                  { country: "🇦🇪 UAE", visa: "ゴールデンビザ · グリーンビザ" },
                  { country: "🇦🇺 オーストラリア", visa: "ワーキングホリデー" },
                  { country: "🇰🇷 韓国", visa: "ワーキングホリデー" },
                ].map(({ country, visa }) => (
                  <Link
                    key={country}
                    href="/visa-simulator"
                    style={{
                      padding: "18px 20px",
                      background: "var(--color-bg)",
                      textDecoration: "none",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-fg)",
                        margin: "0 0 4px",
                      }}
                    >
                      {country}
                    </p>
                    <KaiMono style={{ color: "var(--color-sumi-400)", fontSize: "0.625rem" }}>
                      {visa}
                    </KaiMono>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
