import Link from "next/link";
import { EnCaption, Hairline, KaiMono } from "./kai";

export default function Footer() {
  const cols = [
    {
      h: "KAIプレイス",
      en: "Place",
      items: [
        { label: "日本食レストラン", href: "/sg/place/restaurant" },
        { label: "クリニック・病院", href: "/sg/place/clinic" },
        { label: "美容室・ネイル", href: "/sg/place/beauty" },
        { label: "日本食スーパー", href: "/sg/place/supermarket" },
        { label: "不動産エージェント", href: "/sg/place/real-estate" },
        { label: "教育・インター校", href: "/sg/place/education" },
      ],
    },
    {
      h: "KAIジョブ",
      en: "Job",
      items: [
        { label: "金融・コンサル", href: "/sg/jobs/finance" },
        { label: "物流・商社", href: "/sg/jobs/trading" },
        { label: "IT・Web", href: "/sg/jobs/it" },
        { label: "製造業", href: "/sg/jobs/manufacturing" },
        { label: "小売・飲食", href: "/sg/jobs/restaurant" },
        { label: "人材紹介", href: "/sg/jobs/hr" },
      ],
    },
    {
      h: "KAIコラム",
      en: "Column",
      items: [
        { label: "ビザ・移住", href: "/sg/column" },
        { label: "税金・保険", href: "/sg/column" },
        { label: "住居・医療", href: "/sg/column" },
        { label: "教育・子育て", href: "/sg/column" },
        { label: "金融・銀行", href: "/sg/column" },
        { label: "生活・文化", href: "/sg/column" },
      ],
    },
  ];

  return (
    <footer
      style={{
        background: "var(--color-sumi-900)",
        color: "var(--color-kinari-200)",
        padding: "56px 40px 28px",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* 4カラムグリッド */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 40,
          }}
          className="grid-cols-1 md:grid-cols-4"
        >
          {/* ブランド */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 28 28" aria-hidden="true">
                <rect x="1" y="1" width="26" height="26" fill="none" stroke="var(--color-kinari-200)" strokeWidth="1.5" />
                <text x="14" y="19" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="16" fontWeight="600" fill="var(--color-shu-300)">海</text>
              </svg>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--color-kinari-50)",
                  letterSpacing: "0.04em",
                }}
              >
                Kaigaijin
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                lineHeight: 1.9,
                color: "var(--color-kinari-200)",
                opacity: 0.7,
                margin: "0 0 20px",
                maxWidth: 300,
              }}
            >
              国境を越えた暮らしの実務を、在住者の視点で丁寧に届ける。海外在住日本人のためのメディア。
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Link
                href="/visa-simulator"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 14px",
                  background: "transparent",
                  color: "var(--color-kinari-100)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 4,
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                ビザ診断
              </Link>
              <Link
                href="/ask"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 0",
                  background: "transparent",
                  color: "var(--color-shu-300)",
                  border: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: "underline",
                  textDecorationThickness: "1px",
                  textUnderlineOffset: "4px",
                  transition: "all 0.2s ease",
                }}
              >
                匿名Q&A →
              </Link>
            </div>
          </div>

          {/* サービスカラム */}
          {cols.map((col) => (
            <div key={col.h}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-kinari-50)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {col.h}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif-en)",
                    fontSize: "0.5625rem",
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "var(--color-shu-300)",
                    fontStyle: "italic",
                  }}
                >
                  — {col.en}
                </div>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 12.5,
                        color: "var(--color-kinari-200)",
                        opacity: 0.8,
                        textDecoration: "none",
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* メタリンク行 */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "媒体資料", href: "/advertise" },
              { label: "広告掲載", href: "/advertise" },
              { label: "お問い合わせ", href: "/contact" },
              { label: "運営会社", href: "/about" },
              { label: "プライバシー", href: "/privacy" },
              { label: "利用規約", href: "/terms" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11.5,
                  color: "var(--color-kinari-200)",
                  opacity: 0.6,
                  textDecoration: "none",
                  transition: "opacity 0.2s ease",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* コピーライト */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <KaiMono
            style={{
              color: "var(--color-kinari-200)",
              opacity: 0.5,
              letterSpacing: "0.1em",
            }}
          >
            © {new Date().getFullYear()} Kaigaijin · All rights reserved.
          </KaiMono>
          <KaiMono
            style={{
              color: "var(--color-kinari-200)",
              opacity: 0.5,
              letterSpacing: "0.1em",
            }}
          >
            海を渡るひとへ
          </KaiMono>
        </div>
      </div>
    </footer>
  );
}
