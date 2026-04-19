import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CountryTabs from "./CountryTabs";
import { EnCaption } from "./kai";

type Props = {
  countryCode: string;
  countryName: string;
  countryFlag: string;
  currentLabel: string;
  label: string;        // 「KAI Place · Singapore Directory」など
  title: string;        // h1（朱色スパンを含む場合は ReactNode にしてもよい）
  titleAccent?: string; // 朱色にするサブテキスト（改行後に表示）
  subtitle?: string;
  articleCount: number;
  placeCount: number;
  right?: React.ReactNode;
  subTabs?: React.ReactNode;
};

export default function CountryHero({
  countryCode,
  countryName,
  countryFlag,
  currentLabel,
  label,
  title,
  titleAccent,
  subtitle,
  articleCount,
  placeCount,
  right,
  subTabs,
}: Props) {
  return (
    <div style={{ background: "var(--color-bg-soft)", borderBottom: "1px solid var(--color-sumi-900)" }}>
      {/* 国別タブ（記事/スポット/求人） */}
      <CountryTabs
        countryCode={countryCode}
        articleCount={articleCount}
        placeCount={placeCount}
      />

      {/* ヒーロー本体 */}
      <section style={{ padding: "32px 0 48px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 40px" }}>
          {/* パンくず */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 28,
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: "var(--color-sumi-500)",
            }}
          >
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              トップ
            </Link>
            <ChevronRight size={12} />
            <Link href={`/${countryCode}/column`} style={{ color: "inherit", textDecoration: "none" }}>
              {countryFlag} {countryName}
            </Link>
            <ChevronRight size={12} />
            <span style={{ color: "var(--color-fg)" }}>{currentLabel}</span>
          </nav>

          {/* メインコンテンツ */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 40,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 300 }}>
              <EnCaption
                style={{
                  color: "var(--color-shu-500)",
                  letterSpacing: "0.18em",
                  fontSize: "0.6875rem",
                  marginBottom: 14,
                  display: "block",
                }}
              >
                {label}
              </EnCaption>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  fontWeight: 600,
                  margin: "0 0 16px",
                  letterSpacing: "0.02em",
                  lineHeight: 1.1,
                  color: "var(--color-fg)",
                }}
              >
                {title}
                {titleAccent && (
                  <>
                    <br />
                    <span style={{ color: "var(--color-shu-500)" }}>{titleAccent}</span>
                  </>
                )}
              </h1>
              {subtitle && (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    color: "var(--color-sumi-500)",
                    margin: 0,
                    maxWidth: 560,
                    lineHeight: 1.9,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {right && (
              <div style={{ flexShrink: 0, width: "100%", maxWidth: 320 }}>
                {right}
              </div>
            )}
          </div>

          {/* サブタブ（プレイスページのカテゴリ/エリア/地図） */}
          {subTabs && (
            <div style={{ marginTop: 32 }}>
              {subTabs}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
