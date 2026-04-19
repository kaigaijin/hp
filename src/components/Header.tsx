"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { countries } from "@/lib/countries";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { EnCaption, Hairline, DottedRule, KaiMono } from "./kai";

const SCOPED_SERVICES = [
  { key: "place", label: "KAIプレイス", sub: "日本人向けスポット", enLabel: "KAI Place" },
  { key: "jobs",  label: "KAIジョブ",   sub: "現地求人",          enLabel: "KAI Job" },
  { key: "column",label: "KAIコラム",   sub: "海外生活の記事",    enLabel: "KAI Column" },
];

type MenuKey = "countries" | "place" | "jobs" | "column" | null;

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menu, setMenu] = useState<MenuKey>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // 現在の国スコープを URL から推定（第1セグメントが国コード）
  const segments = pathname.split("/").filter(Boolean);
  const urlCountryCode = countries.find((c) => c.code === segments[0])?.code ?? "sg";
  const [countryCode, setCountryCode] = useState(urlCountryCode);
  const activeCountry = countries.find((c) => c.code === countryCode) ?? countries[0];

  const openMenu = useCallback((k: MenuKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(k);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setMenu(null), 180);
  }, []);

  const handleChooseCountry = (code: string) => {
    setCountryCode(code);
    setMenu(null);
    // 現在のサービス種別を維持しつつ国を切り替え
    const serviceSlug = segments[1];
    if (serviceSlug) {
      router.push(`/${code}/${serviceSlug}`);
    } else {
      router.push(`/${code}`);
    }
  };

  const handleChooseService = (serviceKey: string, code: string) => {
    setCountryCode(code);
    setMenu(null);
    const slug = serviceKey === "place" ? "place" : serviceKey;
    router.push(`/${code}/${slug}`);
  };

  const serviceDescriptions: Record<string, string> = {
    place:  "クリニック、日系店、美容室、不動産など、現地在住者視点で編集した情報。",
    jobs:   "日系企業、現地採用、EP/S Pass取得支援ありなど、日本人が応募可能な求人。",
    column: "ビザ、税金、住居、医療、教育——その国で暮らす人のための実務記事。",
  };
  const serviceTitles: Record<string, React.ReactNode> = {
    place:  <>国ごとの<br /><span style={{ color: "var(--color-shu-500)" }}>日本人向けスポット</span></>,
    jobs:   <>国ごとの<br /><span style={{ color: "var(--color-shu-500)" }}>日本人向け求人</span></>,
    column: <>国ごとの<br /><span style={{ color: "var(--color-shu-500)" }}>暮らしの記事</span></>,
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--color-bg-soft)",
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "blur(8px)",
      }}
      onMouseLeave={scheduleClose}
    >
      {/* ── メインバー ── */}
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 40px",
          height: 72,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
        className="px-4 md:px-10"
      >
        {/* ロゴ */}
        <Link
          href="/"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <rect x="1" y="1" width="26" height="26" fill="none" stroke="var(--color-fg)" strokeWidth="1.5" />
            <text x="14" y="19" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="16" fontWeight="600" fill="var(--color-shu-500)">海</text>
          </svg>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600, letterSpacing: "0.04em", color: "var(--color-fg)", lineHeight: 1 }}>
              Kaigaijin
            </div>
            <div style={{ fontFamily: "var(--font-serif-en)", fontSize: "0.5625rem", letterSpacing: "0.3em", color: "var(--color-sumi-400)", textTransform: "uppercase", marginTop: 3 }}>
              海外在住日本人のメディア
            </div>
          </div>
        </Link>

        {/* 国スコープ切替ボタン（デスクトップ） */}
        <button
          className="hidden md:flex"
          onMouseEnter={() => openMenu("countries")}
          onClick={() => openMenu(menu === "countries" ? null : "countries")}
          style={{
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: menu === "countries" ? "var(--color-bg)" : "transparent",
            border: "1px solid var(--color-sumi-900)",
            borderRadius: 4,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            color: "var(--color-fg)",
            flexShrink: 0,
          }}
          title="国を切り替え"
          aria-expanded={menu === "countries"}
          aria-haspopup="true"
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{activeCountry.flag}</span>
          <div style={{ textAlign: "left", lineHeight: 1.2 }}>
            <div style={{ fontFamily: "var(--font-serif-en)", fontSize: "0.53125rem", letterSpacing: "0.2em", color: "var(--color-sumi-400)", textTransform: "uppercase" }}>Country</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 600 }}>{activeCountry.name}</div>
          </div>
          <span style={{ fontSize: 9, color: "var(--color-sumi-400)", marginLeft: 4 }}>▾</span>
        </button>

        {/* デスクトップナビ */}
        <nav className="hidden md:flex" style={{ marginLeft: "auto", display: "flex", gap: 20, alignItems: "center" }}>
          {SCOPED_SERVICES.map((it) => (
            <div
              key={it.key}
              onMouseEnter={() => openMenu(it.key as MenuKey)}
              style={{ position: "relative" }}
            >
              <Link
                href={`/${countryCode}/${it.key === "place" ? "place" : it.key}`}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: pathname.includes(`/${it.key}`) ? "var(--color-shu-500)" : "var(--color-sumi-600)",
                  cursor: "pointer",
                  paddingBottom: 4,
                  borderBottom: pathname.includes(`/${it.key}`) ? "2px solid var(--color-shu-500)" : "2px solid transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                {it.label}
                <span style={{ fontSize: 8, color: "var(--color-sumi-400)" }}>▾</span>
              </Link>
            </div>
          ))}

          {/* 縦仕切り */}
          <div style={{ width: 1, height: 18, background: "var(--color-border)" }} />

          <Link
            href="/visa-simulator"
            style={{
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
              color: pathname === "/visa-simulator" ? "var(--color-shu-500)" : "var(--color-sumi-600)",
              textDecoration: "none", transition: "color 0.2s ease",
            }}
          >
            ビザ診断
          </Link>
          <Link
            href="/ask"
            style={{
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
              color: pathname === "/ask" ? "var(--color-shu-500)" : "var(--color-sumi-600)",
              textDecoration: "none", transition: "color 0.2s ease",
            }}
          >
            匿名Q&A
          </Link>

          <Link
            href="/visa-simulator"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "var(--color-shu-500)",
              color: "#fff",
              border: "1px solid var(--color-shu-700)",
              borderRadius: 4,
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: "0.02em",
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            診断 →
          </Link>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ThemeToggle />
            <UserMenu />
          </div>
        </nav>

        {/* モバイルメニューボタン */}
        <div className="flex md:hidden items-center gap-1 ml-auto">
          <UserMenu />
          <ThemeToggle />
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{ padding: 6, color: "var(--color-sumi-600)", background: "none", border: "none", cursor: "pointer" }}
            aria-label="メニュー"
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── メガメニュー ── */}
      {menu && (
        <div
          onMouseEnter={() => openMenu(menu)}
          onMouseLeave={scheduleClose}
          role="dialog"
          aria-label="メニュー"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            background: "var(--color-bg)",
            borderTop: "1px solid var(--color-sumi-900)",
            borderBottom: "1px solid var(--color-sumi-900)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
            zIndex: 60,
          }}
        >
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 40px" }}>
            {menu === "countries" ? (
              /* 国スコープ切替パネル */
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
                  <div>
                    <EnCaption color="var(--color-shu-500)">Country Scope · いまの国を切り替える</EnCaption>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, marginTop: 6, color: "var(--color-fg)" }}>
                      どの国の暮らしを見ますか？
                    </div>
                  </div>
                  <KaiMono style={{ color: "var(--color-sumi-400)" }}>{countries.length} countries · click to switch</KaiMono>
                </div>
                <Hairline style={{ marginBottom: 18 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {countries.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => handleChooseCountry(c.code)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: c.code === countryCode ? "var(--color-shu-50)" : "var(--color-bg-soft)",
                        border: `1px solid ${c.code === countryCode ? "var(--color-shu-500)" : "var(--color-border)"}`,
                        cursor: "pointer",
                        borderRadius: 4,
                        transition: "all 0.15s ease",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{c.flag}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 600, color: "var(--color-fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        <KaiMono style={{ color: "var(--color-sumi-400)", fontSize: "0.59375rem" }}>{c.population}</KaiMono>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* サービス × 国パネル */
              <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 40 }}>
                <div>
                  <EnCaption color="var(--color-shu-500)">
                    {SCOPED_SERVICES.find((s) => s.key === menu)?.enLabel}
                  </EnCaption>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 600, margin: "8px 0 12px", letterSpacing: "0.02em", lineHeight: 1.2, color: "var(--color-fg)" }}>
                    {serviceTitles[menu]}
                  </h3>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--color-sumi-500)", lineHeight: 1.9, margin: "0 0 18px" }}>
                    {serviceDescriptions[menu]}
                  </p>
                  <DottedRule />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                    <EnCaption>Choose a country</EnCaption>
                    <KaiMono style={{ color: "var(--color-sumi-400)", fontSize: "0.65625rem" }}>{countries.length} countries</KaiMono>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--color-border)", border: "1px solid var(--color-border)" }}>
                    {countries.map((c) => {
                      const active = c.code === countryCode;
                      return (
                        <button
                          key={c.code}
                          onClick={() => handleChooseService(menu, c.code)}
                          style={{
                            background: active ? "var(--color-shu-50)" : "var(--color-bg)",
                            padding: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            borderLeft: active ? "3px solid var(--color-shu-500)" : "3px solid transparent",
                            border: "none",
                            transition: "all 0.12s ease",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{c.flag}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 600, color: "var(--color-fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── モバイルドロワー ── */}
      {drawerOpen && (
        <nav
          className="md:hidden"
          style={{
            background: "var(--color-bg)",
            borderBottom: "1px solid var(--color-border)",
            padding: "0 16px 16px",
            maxHeight: "calc(100vh - 72px)",
            overflowY: "auto",
          }}
        >
          {/* 国選択 */}
          <div style={{ paddingTop: 16, marginBottom: 12 }}>
            <EnCaption>Countries</EnCaption>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
            {countries.map((c) => (
              <Link
                key={c.code}
                href={`/${c.code}`}
                prefetch={false}
                onClick={() => setDrawerOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  background: c.code === urlCountryCode ? "var(--color-shu-50)" : "var(--color-bg-soft)",
                  border: `1px solid ${c.code === urlCountryCode ? "var(--color-shu-500)" : "var(--color-border)"}`,
                  borderRadius: 4,
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 18 }}>{c.flag}</span>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 600, color: "var(--color-fg)" }}>{c.name}</span>
              </Link>
            ))}
          </div>
          <Hairline style={{ marginBottom: 12 }} />
          {/* サービスリンク */}
          {[
            { href: "/visa-simulator", label: "ビザ診断" },
            { href: "/ask", label: "匿名Q&A" },
            { href: "/overseas/column", label: "海外生活コラム" },
            { href: "/contact", label: "お問い合わせ" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              style={{
                display: "block",
                padding: "10px 0",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-sumi-600)",
                textDecoration: "none",
                borderBottom: "1px dotted var(--color-border)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
