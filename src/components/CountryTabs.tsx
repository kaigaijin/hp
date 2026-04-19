"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MapPin, BriefcaseBusiness } from "lucide-react";

type Props = {
  countryCode: string;
  articleCount: number;
  placeCount: number;
};

export default function CountryTabs({ countryCode, articleCount, placeCount }: Props) {
  const pathname = usePathname();

  const isArticles = pathname === `/${countryCode}/column` || pathname.startsWith(`/${countryCode}/column/`);
  const isplace = pathname.startsWith(`/${countryCode}/place`);
  const isJobs = pathname.startsWith(`/${countryCode}/jobs`);

  const tabs = [
    {
      href: `/${countryCode}/column`,
      label: "KAIコラム",
      count: articleCount,
      icon: <BookOpen size={13} />,
      active: isArticles,
    },
    {
      href: `/${countryCode}/place`,
      label: "KAIプレイス",
      count: placeCount,
      icon: <MapPin size={13} />,
      active: isplace,
    },
    {
      href: `/${countryCode}/jobs`,
      label: "KAIジョブ",
      count: null,
      icon: <BriefcaseBusiness size={13} />,
      active: isJobs,
    },
  ];

  return (
    <div
      style={{
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ display: "flex" }}>
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 20px",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                color: tab.active ? "var(--color-shu-500)" : "var(--color-sumi-500)",
                borderBottom: tab.active
                  ? "2px solid var(--color-shu-500)"
                  : "2px solid transparent",
                marginBottom: -1,
                transition: "color 0.15s ease, border-color 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: tab.active ? "var(--color-shu-400)" : "var(--color-sumi-400)" }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: tab.active ? "var(--color-shu-400)" : "var(--color-sumi-400)",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
